import { find, isPlainObject, cloneDeep, memoize } from 'lodash';
import { runTask, wrapTask } from 'utils/Concurrent.es6';
import assetEditorInterface from 'data/editingInterfaces/asset';
import { caseof as caseofEq } from 'sum-types/caseof-eq';
import { deepFreeze } from 'utils/Freeze.es6';
import createPrefetchCache from 'data/CMA/EntityPrefetchCache.es6';
import TheLocaleStore from 'TheLocaleStore';
import Widgets from 'widgets';

/**
 * @ngdoc service
 * @name app/entity_editor/DataLoader
 * @description
 * This module exports two functions that load data required by the
 * entity editor.
 *
 * The arguments are the space context and the entity id and the loader
 * returns a promise that resolves to an object with the following
 * properties.
 * - `entity`. An instance of a client library entity.
 * - `fieldControls`. An object containing the data to build the field
 *   editors. This object is created by the `buildRenderable()`
 *   function in the `widgets/widgets` service.
 *
 * When loading an entry the returned object has an additional
 * `contentType` property. Its value is an instance of a client
 * library content type.
 *
 * Editor data can be mocked using the
 * 'mocks/app/entity_editor/DataLoader' module.
 */

/**
 * @ngdoc method
 * @name app/entity_editor/DataLoader#loadEntry
 * @param {SpaceContext} spaceContext
 * @param {string} id
 * @returns {object}
 */
// TODO we should accept a specialized object instead of the whole
// space context.
// TODO we should deep freeze all the data
export function loadEntry(spaceContext, id) {
  const loader = makeEntryLoader(spaceContext);
  return loadEditorData(loader, id);
}

/**
 * @ngdoc method
 * @name app/entity_editor/DataLoader#loadAsset
 * @param {SpaceContext} spaceContext
 * @param {string} id
 * @returns {object}
 */
export function loadAsset(spaceContext, id) {
  const loader = makeAssetLoader(spaceContext);
  return loadEditorData(loader, id);
}

/**
 * @ngdoc method
 * @name app/entity_editor/DataLoader#makePrefetchEntryLoader
 * @description
 * Given a space context and a property of an array of IDs we return a
 * function that loads and caches editor data. The returned function
 * accepts an ID and returns the editor data for that ID.
 *
 * The entry data is prefetched in bulk when the value of `ids$` changes.
 * Content type and editor interface data is cached.
 *
 * NOTE This function currently is specialized to entries. It should be
 * easy to generlize this if needed.
 *
 * @param {SpaceContext} spaceContext
 * @param {K.Property<string[]>} ids$
 */
export function makePrefetchEntryLoader(spaceContext, ids$) {
  const cache = createPrefetchCache(query => {
    return spaceContext.space.getEntries(query);
  });

  const loader = makeEntryLoader(spaceContext);
  loader.getEntity = function* getEntity(id) {
    const entity = yield cache.get(id);
    if (entity) {
      return entity;
    } else {
      // Fall back to requesting a single entry
      // The prefetch cache uses the query endpoint to get entries.
      // Because the CMA is inconsistent newly created entries may
      // not be available from the query endpoint yet. We try to
      // get them from the single resource endpoint instead.
      return yield spaceContext.space.getEntry(id);
    }
  };

  ids$.onValue(cache.set);

  return function load(id) {
    return loadEditorData(loader, id);
  };
}

/**
 * Loads all the resources from the loader and builds the editor data.
 *
 * Loaders are created by `makeEntryLoader()` and `makeAssetLoader()`.
 */
function loadEditorData(loader, id) {
  return runTask(function*() {
    const entity = yield* loader.getEntity(id);
    const contentType = yield* loader.getContentType(entity);
    const fieldControls = yield loader.getFieldControls(contentType);
    const entityInfo = makeEntityInfo(entity, contentType);
    const openDoc = loader.getOpenDoc(entity, contentType);
    return Object.freeze({
      entity,
      contentType,
      fieldControls,
      entityInfo,
      openDoc
    });
  });
}

// Loaders provide a specialized interface to fetch the resources need
// for the editor data.
// They provide a bridge between the 'spaceContext' and the
// `loadEditorData()` function.
function makeEntryLoader(spaceContext) {
  return {
    getEntity(id) {
      return fetchEntity(spaceContext, 'Entry', id);
    },
    getContentType: function*(entity) {
      const ctId = entity.data.sys.contentType.sys.id;
      return yield spaceContext.publishedCTs.fetch(ctId);
    },
    // We memoize the controls so that we do not fetch them multiple
    // times for the bulk editor
    getFieldControls: memoize(
      wrapTask(function*(contentType) {
        const ei = yield spaceContext.editingInterfaces.get(contentType.data);
        return Widgets.buildRenderable(ei.controls, spaceContext.widgets.getAll());
      })
    ),
    getOpenDoc: makeDocOpener(spaceContext)
  };
}

function makeAssetLoader(spaceContext) {
  return {
    getEntity: function(id) {
      const entity = fetchEntity(spaceContext, 'Asset', id);
      return entity;
    },
    getContentType: function*() {
      return null;
    },
    getFieldControls: function() {
      const renderable = Widgets.buildRenderable(
        assetEditorInterface.widgets,
        spaceContext.widgets.getAll()
      );
      return Promise.resolve(renderable);
    },
    getOpenDoc: makeDocOpener(spaceContext)
  };
}

function makeDocOpener(spaceContext) {
  return function getOpenDoc(entity, contentType) {
    return function open(lifeline) {
      return spaceContext.docPool.get(entity, contentType, spaceContext.user, lifeline);
    };
  };
}

function makeEntityInfo(entity, contentType) {
  return deepFreeze({
    id: entity.data.sys.id,
    type: entity.data.sys.type,
    contentTypeId: contentType ? contentType.data.sys.id : null,
    // TODO Normalize CT data if this property is used by more advanced
    // services like the 'Document' controller and the 'cfEntityField'
    // directive. Normalizing means that we set external field IDs from
    // internal ones, etc. See for example 'data/editingInterfaces/transformer'
    contentType: contentType ? cloneDeep(contentType.data) : null
  });
}

// TODO instead of fetching a client entity object we should only fetch
// the payload
function* fetchEntity(spaceContext, type, id) {
  const space = spaceContext.space;
  const entity = yield caseofEq(type, [
    ['Entry', () => space.getEntry(id)],
    ['Asset', () => space.getAsset(id)]
  ]);
  sanitizeEntityData(entity.data, TheLocaleStore.getPrivateLocales());
  return entity;
}

/**
 * Given an entry payload we make sure that the following holds.
 *
 * - 'data.fields' is always an object
 * - 'data.fields[fieldId]' is always an object
 * - The keys of 'data.fields[fieldId]' are all valid locales
 */
function sanitizeEntityData(data, locales) {
  if (!isPlainObject(data.fields)) {
    data.fields = {};
  }
  Object.keys(data.fields).forEach(fieldId => {
    const fieldValues = data.fields[fieldId];
    if (isPlainObject(fieldValues)) {
      deleteUnusedLocales(fieldValues, locales);
    } else {
      delete data.fields[fieldId];
    }
  });
}

/**
 * Given an object of {locale: value} mappings and a list of locales we
 * remove those properties from the object that are not valid locales.
 */
function deleteUnusedLocales(fieldValues, locales) {
  Object.keys(fieldValues).forEach(internalCode => {
    if (!find(locales, { internal_code: internalCode })) {
      delete fieldValues[internalCode];
    }
  });
}
