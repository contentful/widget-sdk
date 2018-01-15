import $rootScope from '$rootScope';
import contentPreview from 'contentPreview';
import * as Analytics from 'analytics/Analytics';
import {runTask} from 'utils/Concurrent';
import * as _ from 'lodash';

const ASSET_PROCESSING_TIMEOUT = 60000;

export function getCreator (spaceContext, itemHandlers, templateName, selectedLocaleCode) {
  const creationErrors = [];
  const handledItems = {};
  return {
    create
  };

  /*
   * This method fires all the actions for creating Content Types, Assets,
   * Entries, API Keys and it returns an object with two promises:
   *
   * contentCreated - resolves when content types are created and published, assets
   * are created, entries are created (and one entry is published).
   *
   * spaceSetup - resolves when _everything_ (API keys, assets are processed and
   * published, editing interfaces are created, preview env with discovery app)
   * is processed
   *
   * Each created item will call the custom success/error handlers and
   * notify the provided user callbacks, so the user can do things like
   * update the status on the UI.
   *
   * We are trying to proceed with all requests, and then, in the end, in case
   * any errors happened, we reject the whole promise. However, we will still
   * create an example space with everything what is possible.
   */
  function create (template) {
    const allPromises = [];

    const contentCreated = runTask(function* () {
      const createdContentTypes = yield Promise.all(template.contentTypes.map(createContentType));
      // we can create API key as soon as space is created
      // and it is okay to do it in the background
      const apiKeyPromise = Promise.all(template.apiKeys.map(createApiKey));
      // we can proceed without publishing interfaces, creating is enough
      // publishing can be finished in the background
      yield publishContentTypes(createdContentTypes);
      // editing interfaces should be called after publishing only
      const editingInterfacesPromise = Promise.all(
        template.editingInterfaces.map(createEditingInterface)
      );

      // we need to create assets before proceeding
      const assets = useSelectedLocale(template.assets, selectedLocaleCode);
      const createdAssets = yield Promise.all(assets.map(createAsset));

      // we can process and publish assets in the background,
      // we still can link them inside entries
      const processAssetsPromise = processAssets(createdAssets);
      const publishAssetsPromise = processAssetsPromise.then(publishAssets);

      const entries = useSelectedLocale(template.entries, selectedLocaleCode);
      const createdEntries = yield Promise.all(entries.map(createEntry));

      const publishedEntries = yield publishEntries(createdEntries);

      const createPreviewEnvPromise = Promise.all([
        apiKeyPromise,
        publishedEntries
      ]).then(() => createPreviewEnvironment(template.contentTypes));

      allPromises.push(editingInterfacesPromise, publishAssetsPromise, createPreviewEnvPromise);

      if (creationErrors.length > 0) {
        const errorMessage = 'Error during space template creation: ' + JSON.stringify({
          errors: creationErrors,
          template: templateName
        }, null, 2);
        throw new Error(errorMessage);
      }
    });

    // in case you want to want to wait for the whole process
    const spaceSetup = Promise.all(allPromises.concat(contentCreated));

    return { contentCreated, spaceSetup };
  }

  function handleItem (item, actionData, response) {
    const itemKey = generateItemId(item, actionData);
    if (!(itemKey in handledItems)) {
      handledItems[itemKey] = {
        performedActions: [],
        response: response
      };
    }
    if (!_.includes(handledItems[itemKey].performedActions, actionData.action)) {
      handledItems[itemKey].performedActions.push(actionData.action);
    }
  }

  function itemIsHandled (item, actionData) {
    const itemKey = generateItemId(item, actionData);
    return itemKey in handledItems && _.includes(handledItems[itemKey].performedActions, actionData.action);
  }

  function getHandledItemResponse (item, actionData) {
    const itemKey = generateItemId(item, actionData);
    return itemKey in handledItems ? handledItems[itemKey].response : null;
  }

  function makeItemSuccessHandler (item, actionData) {
    return function (response) {
      handleItem(item, actionData, response);
      itemHandlers.onItemSuccess(generateItemId(item, actionData), {
        item: item,
        actionData: actionData,
        response: response
      }, templateName);
      return response;
    };
  }

  function makeItemErrorHandler (item, actionData) {
    return function (error) {
      creationErrors.push(`error ${getErrorMessage(error)} during ${actionData.action} on entityType: ${actionData.entity} on entityId: ${getItemId(item)}`);
      itemHandlers.onItemError(generateItemId(item, actionData), {
        item: item,
        actionData: actionData,
        error: error
      });
      // not rejecting the promise (see comment on create method)
      return null;
    };
  }

  function makeHandlers (item, action, entity) {
    const data = { action: action, entity: entity };
    item = item.data || item;
    return {
      success: makeItemSuccessHandler(item, data),
      error: makeItemErrorHandler(item, data),
      itemWasHandled: itemIsHandled(item, data),
      response: getHandledItemResponse(item, data)
    };
  }

  function createContentType (contentType) {
    const handlers = makeHandlers(contentType, 'create', 'ContentType');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    return spaceContext.space.createContentType(contentType)
      .then(handlers.success)
      .catch(handlers.error);
  }

  function publishContentTypes (contentTypes) {
    return Promise.all(contentTypes.map((contentType) => {
      if (contentType) {
        const handlers = makeHandlers(contentType, 'publish', 'ContentType');
        if (handlers.itemWasHandled) {
          return Promise.resolve();
        }
        const version = _.get(contentType, 'data.sys.version');
        return contentType.publish(version)
          .then(handlers.success)
          .catch(handlers.error);
      }
    }));
  }

  function createEditingInterface (editingInterface) {
    const handlers = makeHandlers(editingInterface, 'create', 'EditingInterface');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    const repo = spaceContext.editingInterfaces;
    // The content type has a default editor interface with version 1.
    editingInterface.data.sys.version = 1;
    return repo
      .save(editingInterface.contentType, editingInterface.data)
      .then(handlers.success, handlers.error);
  }

  function createAsset (asset) {
    const handlers = makeHandlers(asset, 'create', 'Asset');
    if (handlers.itemWasHandled) {
      return Promise.resolve();
    }
    return spaceContext.space.createAsset(asset)
      .then(handlers.success)
      .catch(handlers.error);
  }

  function processAssets (assets) {
    return Promise.all(assets.map((asset) => {
      if (asset) {
        const handlers = makeHandlers(asset, 'process', 'Asset');
        if (handlers.itemWasHandled) {
          return Promise.resolve();
        }
        const version = _.get(asset, 'data.sys.version');
        return processAsset(asset, version)
          .then(handlers.success)
          .catch(handlers.error);
      }
    }));
  }

  function processAsset (asset, version) {
    let destroyDoc;
    return new Promise((resolve, reject) => {
      const processingTimeout = setTimeout(function () {
        if (destroyDoc) {
          destroyDoc();
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({error: 'timeout processing'});
      }, ASSET_PROCESSING_TIMEOUT);

      // TODO: this is the only place where we use
      // docConnection outside of spaceContext. We
      // need to wait for assets to process in order
      // to publish them in the next step.
      spaceContext.docConnection.open(asset)
        .then(function (info) {
          destroyDoc = info.destroy;
          info.doc.on('remoteop', (ops) => remoteOpHandler(ops, { resolve, processingTimeout }));
          asset.process(version, selectedLocaleCode);
        }, function (err) {
          clearTimeout(processingTimeout);
          reject(err);
        });
    });

    function remoteOpHandler (ops, { resolve, processingTimeout }) {
      $rootScope.$apply(function () {
        clearTimeout(processingTimeout);
        const op = ops && ops.length > 0 ? ops[0] : null;
        if (op && op.p && op.oi) {
          const path = op.p;
          const inserted = op.oi;
          if (path[0] === 'fields' && path[1] === 'file' && 'url' in inserted) {
            destroyDoc();
            resolve(asset);
          }
        }
      });
    }
  }

  function publishAssets (assets) {
    return Promise.all(assets.map((asset) => {
      if (asset) {
        const handlers = makeHandlers(asset, 'publish', 'Asset');
        if (handlers.itemWasHandled) {
          return Promise.resolve();
        }
        const version = _.get(asset, 'data.sys.version');
        return asset.publish(version + 1)
          .then(handlers.success)
          .catch(handlers.error);
      }
    }));
  }

  function createEntry (entry) {
    const handlers = makeHandlers(entry, 'create', 'Entry');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    const contentTypeId = _.get(entry, 'sys.contentType.sys.id');
    delete entry.contentType;
    return spaceContext.space.createEntry(contentTypeId, entry)
      .then(handlers.success)
      .catch(handlers.error);
  }

  function publishEntries (entries) {
    // we wait until the first item is published (using Promise.race)
    // since it is the last operation before we resolve this promise
    // so other items publishing time won't be different
    const promises = entries.filter(Boolean).map(function (entry) {
      const handlers = makeHandlers(entry, 'publish', 'Entry');
      if (handlers.itemWasHandled) {
        return Promise.resolve();
      }
      const version = _.get(entry, 'data.sys.version');
      return entry.publish(version)
        .then(handlers.success)
        .catch(handlers.error);
    });

    // if an array is empty, Promise.race() will never resolve
    return promises.length ? Promise.race(promises) : Promise.resolve();
  }

  function createApiKey (apiKey) {
    const handlers = makeHandlers(apiKey, 'create', 'ApiKey');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    return spaceContext.apiKeyRepo.create(apiKey.name, apiKey.description)
      .then(res => handlers.success({data: res})) // `handlers` expect Client-style "data" objects
      .catch(handlers.error);
  }

  // Create the discovery app environment if there is an API key
  function createPreviewEnvironment (contentTypes) {
    const baseUrl = 'https://discovery.contentful.com/entries/by-content-type/';
    const spaceId = spaceContext.space.getId();

    return Promise.all([
      spaceContext.apiKeyRepo.getAll(),
      contentPreview.getAll()
    ]).then(([keys, envs]) => {
      function createConfig (ct, token) {
        return {
          contentType: ct.sys.id,
          url: baseUrl + ct.sys.id + '/{entry_id}/?space_id=' + spaceId + '&delivery_access_token=' + token,
          enabled: true,
          example: true
        };
      }

      // Create default environment if there is none existing, and an API key is present
      if (keys.length && !Object.keys(envs).length) {
        const accessToken = keys[0].accessToken;

        const env = {
          name: 'Discovery App',
          description: 'To help you get started, we\'ve added our own Discovery App to preview content.',
          configs: contentTypes.map(function (ct) {
            return createConfig(ct, accessToken);
          })
        };
        return contentPreview.create(env).then(function (env) {
          Analytics.track('content_preview:created', {
            name: env.name,
            id: env.sys.id,
            isDiscoveryApp: true
          });
        });
      } else {
        // Don't do anything
        Promise.resolve();
      }
    });
  }
}

function generateItemId (item, actionData) {
  return actionData.entity + getItemId(item);
}

function getItemId (item) {
  return _.get(item, 'sys.id') || item.name;
}

function useSelectedLocale (entities, localeCode) {
  return entities.map(entity => Object.assign(entity, {
    fields: _.mapValues(entity.fields, field => {
      return {[localeCode]: _.values(field)[0]};
    })
  }));
}

/**
 * get readable error message
 * @param {Object} error - regular error or request error
 * @return {String} - human-readable error
 */
function getErrorMessage (error) {
  if (!error) {
    return 'unknown error';
  }

  if (error.message) {
    return error.message;
  }

  if (error.body && error.body.message) {
    return error.body.message;
  }

  if (error.status) {
    return error.status;
  }

  return 'unknown error';
}
