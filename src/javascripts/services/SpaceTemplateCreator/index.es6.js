import $rootScope from '$rootScope';
import contentPreview from 'contentPreview';
import * as Analytics from 'analytics/Analytics.es6';
import { runTask } from 'utils/Concurrent.es6';
import * as _ from 'lodash';
import qs from 'qs';
import * as environment from 'environment';
import {
  TEA_MAIN_CONTENT_PREVIEW,
  TEA_CONTENT_PREVIEWS,
  DISCOVERY_APP_BASE_URL
} from './contentPreviewConfig.es6';
import TheLocaleStore from 'TheLocaleStore';
import { enrichTemplate } from './enrichTemplate.es6';

const ASSET_PROCESSING_TIMEOUT = 60000;

// we specify this space name to indicate from which space
// we get template for TEA (the example app). We want to create a specific
// content preview for it, so we need to distinguish it from other templates.
// All other templates use discovery app, as a generic tool to preview your
// content. This is not very reliable, but since we own this repo, we can be
// sure that this space will remain the same, and also, in case it is invalid,
// we will create discovery app for TEA
const TEA_SPACE_ID = environment.settings.contentful.TEASpaceId;

/**
 * @description
 * Returns a creator that populates a space with content from the chosen space template.
 *
 * @param {object} spaceContext
 * @param {object} itemHandlers
 * @param {object} templateInfo
 * @param {string} selectedLocaleCode
 *
 * @return {function}
 */
export function getCreator(spaceContext, itemHandlers, templateInfo, selectedLocaleCode) {
  const templateName = templateInfo.name;
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
   * published, editing interfaces are created, content preview with discovery app/TEA)
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
  function create(rawTemplate) {
    const allPromises = [];

    // we use CDA for getting template values, and therefore some values can't be obtained:
    // 1. description of content types
    // 2. fields' validations of content types
    // 3. editing interfaces (appearance - e.g. slug editor or url editor)
    const template = enrichTemplate(templateInfo, rawTemplate);

    const contentCreated = runTask(function*() {
      const filteredLocales = template.space.locales.filter(
        locale => locale.code !== selectedLocaleCode
      );
      const localesPromise = Promise.all(
        filteredLocales.map(locale => {
          // we create the default locale automatically, so we mark all other locales as non-default
          const saveLocalePromise = spaceContext.localeRepo.save({ ...locale, default: false });
          // we ingore errors. there might be different reasons why it is happening
          // like pricing, too many locales already, etc
          return saveLocalePromise.catch(() => null);
        })
      );

      const createdContentTypes = yield Promise.all(template.contentTypes.map(createContentType));
      // we can create API key as soon as space is created
      // and it is okay to do it in the background
      const apiKeyPromise = Promise.all(template.apiKeys.map(createApiKey));
      // we can proceed without publishing interfaces, creating is enough
      // publishing can be finished in the background
      const publishedCTs = yield publishContentTypes(createdContentTypes);

      if (template.editorInterfaces) {
        const editorInterfacesPromise = Promise.all(
          template.editorInterfaces.map(editorInterface => {
            // function to validate matching content type and editor interface
            const validateCT = contentType => {
              const editorInterfaceId = _.get(editorInterface, 'sys.contentType.sys.id');
              const contentTypeId = _.get(contentType, 'data.sys.id');

              // we need to ensure that ids are truthy
              return editorInterfaceId && editorInterfaceId === contentTypeId;
            };

            const contentType = publishedCTs.find(validateCT);

            // if we don't return a promise, `Promise.all` resolves it automatically
            if (contentType) {
              return createEditingInterface(contentType.data, editorInterface);
            }
          })
        );

        allPromises.push(editorInterfacesPromise);
      }

      // we need to create assets before proceeding
      // we create assets only for default locale. It is a conscious decision, otherwise
      // it will complicate logic (and possibly time) for processing images, since we need
      // to increment version of asset, therefore we can't parallelize it.
      // all example spaces contain assets only for default locale
      const assets = useSelectedLocales(template.assets, [selectedLocaleCode], selectedLocaleCode);
      const createdAssets = yield Promise.all(assets.map(createAsset));

      // we can process and publish assets in the background,
      // we still can link them inside entries
      const processAssetsPromise = processAssets(createdAssets);
      const publishAssetsPromise = processAssetsPromise.then(publishAssets);

      // we need to wait for locales before creating entries
      const createdLocales = yield localesPromise;
      // some locales might fail during creation, we need to filter them out
      const successfullyCreatedLocales = createdLocales.filter(Boolean);
      const successfullyCreatedLocaleCodes = successfullyCreatedLocales.map(locale => locale.code);
      // we need to combine default locale and all successfully created
      const contentLocales = [selectedLocaleCode, ...successfullyCreatedLocaleCodes];

      // no need to refresh locales, if there are no additional (default locale is loaded already)
      if (successfullyCreatedLocales.length) {
        // we set all locales as active, so they will be preselected in entry editor
        Promise.resolve()
          // we need to refresh our locale store, so that the app is aware of new locales
          .then(TheLocaleStore.refresh)
          .then(() => {
            // it expects array of objects, so we have to wrap codes in object
            TheLocaleStore.setActiveLocales(contentLocales.map(code => ({ internal_code: code })));
          });
      }

      const entries = useSelectedLocales(template.entries, contentLocales, selectedLocaleCode);
      const createdEntries = yield Promise.all(entries.map(createEntry));

      const publishedEntries = yield publishEntries(createdEntries);

      const createContentPreviewPromise = Promise.all([apiKeyPromise, publishedEntries]).then(() =>
        templateInfo.spaceId === TEA_SPACE_ID
          ? runTask(createTEAContentPreview, template.contentTypes)
          : createContentPreview(template.contentTypes)
      );

      allPromises.push(publishAssetsPromise, createContentPreviewPromise);

      if (creationErrors.length > 0) {
        const errorMessage =
          'Error during space template creation: ' +
          JSON.stringify(
            {
              errors: creationErrors,
              template: templateName
            },
            null,
            2
          );
        throw new Error(errorMessage);
      }
    });

    // in case you want to want to wait for the whole process
    const spaceSetup = Promise.all(allPromises.concat(contentCreated));

    return { contentCreated, spaceSetup };
  }

  function handleItem(item, actionData, response) {
    const itemKey = generateItemId(item, actionData);
    if (!(itemKey in handledItems)) {
      handledItems[itemKey] = {
        performedActions: [],
        response
      };
    }
    if (!_.includes(handledItems[itemKey].performedActions, actionData.action)) {
      handledItems[itemKey].performedActions.push(actionData.action);
    }
  }

  function itemIsHandled(item, actionData) {
    const itemKey = generateItemId(item, actionData);
    return (
      itemKey in handledItems &&
      _.includes(handledItems[itemKey].performedActions, actionData.action)
    );
  }

  function getHandledItemResponse(item, actionData) {
    const itemKey = generateItemId(item, actionData);
    return itemKey in handledItems ? handledItems[itemKey].response : null;
  }

  function makeItemSuccessHandler(item, actionData) {
    return response => {
      handleItem(item, actionData, response);
      itemHandlers.onItemSuccess(
        generateItemId(item, actionData),
        {
          item,
          actionData,
          response
        },
        templateName
      );
      return response;
    };
  }

  function makeItemErrorHandler(item, actionData) {
    return error => {
      creationErrors.push(
        `error ${getErrorMessage(error)} during ${actionData.action} on entityType: ${
          actionData.entity
        } on entityId: ${getItemId(item)}`
      );
      itemHandlers.onItemError(generateItemId(item, actionData), {
        item,
        actionData,
        error
      });
      // not rejecting the promise (see comment on create method)
      return null;
    };
  }

  function makeHandlers(item, action, entity) {
    const data = { action, entity };
    item = item.data || item;
    return {
      success: makeItemSuccessHandler(item, data),
      error: makeItemErrorHandler(item, data),
      itemWasHandled: itemIsHandled(item, data),
      response: getHandledItemResponse(item, data)
    };
  }

  function createEditingInterface(contentType, editingInterface) {
    const handlers = makeHandlers(editingInterface, 'create', 'EditingInterface');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    const repo = spaceContext.editingInterfaces;
    // The content type has a default editor interface with version 1.
    editingInterface.sys.version = 1;
    return repo
      .save(contentType, editingInterface)
      .then(handlers.success)
      .catch(handlers.error);
  }

  function createContentType(contentType) {
    const handlers = makeHandlers(contentType, 'create', 'ContentType');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    return spaceContext.space
      .createContentType(contentType)
      .then(handlers.success)
      .catch(handlers.error);
  }

  function publishContentTypes(contentTypes) {
    return Promise.all(
      contentTypes.map(contentType => {
        if (contentType) {
          const handlers = makeHandlers(contentType, 'publish', 'ContentType');
          if (handlers.itemWasHandled) {
            return Promise.resolve();
          }
          const version = _.get(contentType, 'data.sys.version');
          return contentType
            .publish(version)
            .then(handlers.success)
            .catch(handlers.error);
        }
      })
    );
  }

  function createAsset(asset) {
    const handlers = makeHandlers(asset, 'create', 'Asset');
    if (handlers.itemWasHandled) {
      return Promise.resolve();
    }
    return spaceContext.space
      .createAsset(asset)
      .then(handlers.success)
      .catch(handlers.error);
  }

  function processAssets(assets) {
    return Promise.all(
      assets.map(asset => {
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
      })
    );
  }

  function processAsset(asset, version) {
    let destroyDoc;
    return new Promise((resolve, reject) => {
      const processingTimeout = setTimeout(() => {
        if (destroyDoc) {
          destroyDoc();
        }
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({ error: 'timeout processing' });
      }, ASSET_PROCESSING_TIMEOUT);

      // TODO: this is the only place where we use
      // docConnection outside of spaceContext. We
      // need to wait for assets to process in order
      // to publish them in the next step.
      spaceContext.docConnection.open(asset).then(
        info => {
          destroyDoc = info.destroy;
          info.doc.on('remoteop', ops => remoteOpHandler(ops, { resolve, processingTimeout }));
          asset.process(version, selectedLocaleCode);
        },
        err => {
          clearTimeout(processingTimeout);
          reject(err);
        }
      );
    });

    function remoteOpHandler(ops, { resolve, processingTimeout }) {
      $rootScope.$apply(() => {
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

  function publishAssets(assets) {
    return Promise.all(
      assets.map(asset => {
        if (asset) {
          const handlers = makeHandlers(asset, 'publish', 'Asset');
          if (handlers.itemWasHandled) {
            return Promise.resolve();
          }
          const version = _.get(asset, 'data.sys.version');
          return asset
            .publish(version + 1)
            .then(handlers.success)
            .catch(handlers.error);
        }
      })
    );
  }

  function createEntry(entry) {
    const handlers = makeHandlers(entry, 'create', 'Entry');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    const contentTypeId = _.get(entry, 'sys.contentType.sys.id');
    delete entry.contentType;
    return spaceContext.space
      .createEntry(contentTypeId, entry)
      .then(handlers.success)
      .catch(handlers.error);
  }

  function publishEntries(entries) {
    // we wait until the first item is published (using Promise.race)
    // since it is the last operation before we resolve this promise
    // so other items publishing time won't be different
    const promises = entries.filter(Boolean).map(entry => {
      const handlers = makeHandlers(entry, 'publish', 'Entry');
      if (handlers.itemWasHandled) {
        return Promise.resolve();
      }
      const version = _.get(entry, 'data.sys.version');
      return entry
        .publish(version)
        .then(handlers.success)
        .catch(handlers.error);
    });

    // if an array is empty, Promise.race() will never resolve
    return promises.length ? Promise.race(promises) : Promise.resolve();
  }

  function createApiKey(apiKey) {
    const handlers = makeHandlers(apiKey, 'create', 'ApiKey');
    if (handlers.itemWasHandled) {
      return Promise.resolve(handlers.response);
    }
    return spaceContext.apiKeyRepo
      .create(apiKey.name, apiKey.description)
      .then(res => handlers.success({ data: res })) // `handlers` expect Client-style "data" objects
      .catch(handlers.error);
  }

  /**
   * @description
   * Function to create content preview specifically for TEA (the example app)
   * This application was built specifically for new contentful users, and has a lot of value
   * in its content, so it has advanced mapping for preview, to redirect user to exact pages,
   * where he can see the content (change in the webapp -> see the changes in the TEA preview)
   */
  function* createTEAContentPreview(contentTypes) {
    const spaceId = spaceContext.space.getId();

    // Mapping for specific content types. Some CTs has no "preview",
    // so we don't set up preview them, thus no confusion created
    const createConfigFns = {
      course: courseConfig,
      category: categoryConfig,
      lesson: lessonConfig,
      lessonCopy: lessonContentConfig,
      lessonImage: lessonContentConfig,
      lessonCodeSnippets: lessonContentConfig,
      layoutHighlightedCourse: mainPageConfig
    };

    const [keys, contentPreviews] = yield Promise.all([
      spaceContext.apiKeyRepo.getAll(),
      contentPreview.getAll()
    ]);

    // Create default content preview if there is none existing, and an API key is present
    if (keys.length && !Object.keys(contentPreviews).length) {
      const key = keys[0];

      // we need to have Preview key as well, so the user can switch to preview API
      // in order to do that, we need to make another cal
      const resolvedKey = yield spaceContext.apiKeyRepo.get(key.sys.id);

      const {
        accessToken: cdaToken,
        preview_api_key: { accessToken: cpaToken }
      } = resolvedKey;

      // we want to wait until the main content preview is created
      yield createContentPreview(TEA_MAIN_CONTENT_PREVIEW, { cdaToken, cpaToken });

      // we set up all other content previews
      yield Promise.all(
        TEA_CONTENT_PREVIEWS.map(params => createContentPreview(params, { cdaToken, cpaToken }))
      );
    }

    function createContentPreview(
      { name, description, baseUrl, isMobile },
      { cdaToken, cpaToken }
    ) {
      const contentPreviewConfig = {
        name,
        description,
        configs: contentTypes
          .map(ct => {
            const fn = createConfigFns[ct.sys.id];
            const url = environment.env === 'production' ? baseUrl.prod : baseUrl.staging;
            // We need 'isMobile' flag because mobile TEA link has the different format
            // And that's because the mobile teas want all params as query params instead of a part the URL
            return fn && fn({ ct, baseUrl: url, spaceId, cdaToken, cpaToken, isMobile });
          })
          // remove all content types without a preview
          .filter(Boolean)
      };

      return contentPreview.create(contentPreviewConfig).then(createdContentPreview => {
        Analytics.track('content_preview:created', {
          name: createdContentPreview.name,
          id: createdContentPreview.sys.id,
          isDiscoveryApp: false
        });
      });
    }
  }

  // Create the discovery app content preview if there is an API key
  function createContentPreview(contentTypes) {
    const baseUrl = DISCOVERY_APP_BASE_URL;
    const spaceId = spaceContext.space.getId();

    return Promise.all([spaceContext.apiKeyRepo.getAll(), contentPreview.getAll()]).then(
      ([keys, contentPreviews]) => {
        function createConfig(ct, token) {
          return {
            contentType: ct.sys.id,
            url:
              baseUrl +
              ct.sys.id +
              '/{entry_id}/?space_id=' +
              spaceId +
              '&delivery_access_token=' +
              token,
            enabled: true,
            example: true
          };
        }

        // Create default content preview if there is none existing, and an API key is present
        if (keys.length && !Object.keys(contentPreviews).length) {
          const accessToken = keys[0].accessToken;

          const contentPreviewConfig = {
            name: 'Discovery App',
            description:
              "To help you get started, we've added our own Discovery App to preview content.",
            configs: contentTypes.map(ct => createConfig(ct, accessToken))
          };
          return contentPreview.create(contentPreviewConfig).then(createdContentPreview => {
            Analytics.track('content_preview:created', {
              name: createdContentPreview.name,
              id: createdContentPreview.sys.id,
              isDiscoveryApp: true
            });
          });
        } else {
          // Don't do anything
          Promise.resolve();
        }
      }
    );
  }
}

function mainPageConfig(params) {
  return makeTEAConfig(params);
}

function courseConfig(params) {
  const courseSlug = '{entry.fields.slug}';
  const urlParam = params.isMobile ? `?courses=${courseSlug}` : `/courses/${courseSlug}`;

  return makeTEAConfig(params, urlParam);
}

function categoryConfig(params) {
  const categorySlug = '{entry.fields.slug}';
  const urlParam = params.isMobile ? `?courses=${categorySlug}` : `/courses/${categorySlug}`;

  return makeTEAConfig(params, urlParam);
}

function lessonConfig(params) {
  const courseSlug = '{entry.linkedBy.fields.slug}';
  const lessonSlug = '{entry.fields.slug}';
  const urlParams = params.isMobile
    ? `?courses=${courseSlug}&lessons=${lessonSlug}`
    : `/courses/${courseSlug}/lessons/${lessonSlug}`;

  return makeTEAConfig(params, urlParams);
}

function lessonContentConfig(params) {
  const courseSlug = '{entry.linkedBy.linkedBy.fields.slug}';
  const lessonSlug = '{entry.linkedBy.fields.slug}';
  const urlParams = params.isMobile
    ? `?courses=${courseSlug}&lessons=${lessonSlug}`
    : `/courses/${courseSlug}/lessons/${lessonSlug}`;

  return makeTEAConfig(params, urlParams);
}

function makeTEAConfig(params, url = '') {
  return {
    contentType: params.ct.sys.id,
    url: makeTEAUrl(params, url),
    enabled: true,
    example: true
  };
}

function makeTEAUrl(params, url = '') {
  // this parameters are TEA specific. You can read more about it in the wiki:
  // https://contentful.atlassian.net/wiki/spaces/PROD/pages/204079331/The+example+app+-+Documentation+of+functionality
  const queryParams = {
    // next params allow to use user's space as a source for the app itself
    // so his changes will be refleced on the app's content
    space_id: params.spaceId,
    delivery_token: params.cdaToken,
    preview_token: params.cpaToken,
    // user will be able to go back to the webapp from TEA using links
    // without this flag, there will be no links in UI of TEA
    editorial_features: 'enabled',
    // we want to have faster feedback for the user after his changes
    // CPA reacts to changes in ~5 seconds, CDA in more than 10
    api: 'cpa'
  };
  const queryString = qs.stringify(queryParams);

  return `${params.baseUrl}${url}${params.isMobile ? '&' : '?'}${queryString}`;
}

function generateItemId(item, actionData) {
  return actionData.entity + getItemId(item);
}

function getItemId(item) {
  return _.get(item, 'sys.id') || item.name;
}

/**
 * @description processes entities (assets/entries) to keep content only
 * in needed locales. If there is no content in locale, and won't be added.
 * In case of default locale some value will be provded.
 * @param {object} entities - assets/entries from space to clone
 * @param {string[]} localeCodes - list of locales to keep content in
 * @param {string} defaultLocaleCode - default locale
 * @returns {object} - assets/entries with content only in needed locales
 */
function useSelectedLocales(entities, localeCodes, defaultLocaleCode) {
  return entities.map(entity =>
    Object.assign(entity, {
      fields: _.mapValues(entity.fields, field => {
        const fieldValuesForAllLocales = Object.values(field);
        return localeCodes.reduce((newEntityFields, localeCode) => {
          // content can actually contain more locales, than our default
          // so we first try to pull content in our locale code
          const hasValue = field.hasOwnProperty(localeCode);
          const isDefaultLocale = localeCode === defaultLocaleCode;
          let value = field[localeCode];

          // we ensure that default locale has at least some value
          // skipping other locales is fine
          if (isDefaultLocale && !hasValue) {
            value = fieldValuesForAllLocales[0];
          }

          // we don't want to set additional locales, if they have no values
          if (hasValue || isDefaultLocale) {
            return Object.assign({}, newEntityFields, {
              [localeCode]: value
            });
          } else {
            return newEntityFields;
          }
        }, {});
      })
    })
  );
}

/**
 * get readable error message
 * @param {Object} error - regular error or request error
 * @return {String} - human-readable error
 */
function getErrorMessage(error) {
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
