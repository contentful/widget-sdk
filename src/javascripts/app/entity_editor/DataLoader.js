import { get, find, isPlainObject, cloneDeep, memoize } from 'lodash';
import { caseof as caseofEq } from 'sum-types/caseof-eq';
import { deepFreeze } from 'utils/Freeze';
import createPrefetchCache from 'data/CMA/EntityPrefetchCache';
import {
  buildRenderables,
  buildSidebarRenderables,
  buildEditorRenderable
} from 'widgets/WidgetRenderable';
import { assetContentType } from 'libs/legacy_client/client';
import * as WidgetStore from 'widgets/WidgetStore';
import * as EditorInterfaceTransformer from 'widgets/EditorInterfaceTransformer';
import * as AdvancedExtensibilityFeature from 'app/settings/extensions/services/AdvancedExtensibilityFeature';
import { getWidgetTrackingContexts } from 'widgets/WidgetTracking';
import { getExtensionLoader } from 'widgets/ExtensionLoaderInstance';
import TheLocaleStore from 'services/localeStore';

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
 *   editors.
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
 * easy to generalize this if needed.
 *
 * @param {SpaceContext} spaceContext
 * @param {K.Property<string[]>} ids$
 */
export function makePrefetchEntryLoader(spaceContext, ids$) {
  const cache = createPrefetchCache(query => {
    return spaceContext.space.getEntries(query);
  });

  const loader = makeEntryLoader(spaceContext);
  loader.getEntity = async function getEntity(id) {
    const entity = await cache.get(id);
    if (entity) {
      return entity;
    } else {
      // Fall back to requesting a single entry
      // The prefetch cache uses the query endpoint to get entries.
      // Because the CMA is inconsistent newly created entries may
      // not be available from the query endpoint yet. We try to
      // get them from the single resource endpoint instead.
      return spaceContext.space.getEntry(id);
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
async function loadEditorData(loader, id) {
  const entity = await loader.getEntity(id);
  const contentTypeId = get(entity, ['data', 'sys', 'contentType', 'sys', 'id']);

  const [contentType, editorInterface, hasAdvancedExtensibility] = await Promise.all([
    loader.getContentType(contentTypeId),
    loader.getEditorInterface(contentTypeId),
    loader.hasAdvancedExtensibility()
  ]);

  const widgets = await loader.getWidgets(editorInterface);

  const { controls, sidebar, editor } = EditorInterfaceTransformer.fromAPI(
    contentType.data,
    editorInterface,
    widgets
  );

  // There's nothing that prevents users to configure a custom
  // sidebar with the API. The feature check only happens here.
  // If a user has no feature, we undefine any config they may
  // have so they see the default one.
  const sidebarConfig = hasAdvancedExtensibility ? sidebar : undefined;
  const editorConfig = hasAdvancedExtensibility ? editor : undefined;

  const fieldControls = buildRenderables(controls, widgets);
  const sidebarExtensions = buildSidebarRenderables(sidebarConfig || [], widgets);
  const editorExtension = buildEditorRenderable(editorConfig, widgets);

  const entityInfo = makeEntityInfo(entity, contentType);
  const openDoc = loader.getOpenDoc(entity, contentType);

  const widgetData = {
    fieldControls,
    sidebar: sidebarConfig,
    sidebarExtensions,
    editorExtension
  };

  const widgetTrackingContexts = getWidgetTrackingContexts(widgetData);

  return Object.freeze({
    entity,
    contentType,
    entityInfo,
    openDoc,
    editorInterface,
    widgetTrackingContexts,
    ...widgetData
  });
}

// Loaders provide a specialized interface to fetch the resources need
// for the editor data.
// They provide a bridge between the 'spaceContext' and the
// `loadEditorData()` function.
function makeEntryLoader(spaceContext) {
  return {
    getEntity: id => fetchEntity(spaceContext, 'Entry', id),
    getContentType(contentTypeId) {
      return spaceContext.publishedCTs.fetch(contentTypeId);
    },
    // We memoize the editor interface so that we do not fetch
    // them multiple times in the bulk editor.
    getEditorInterface: memoize(contentTypeId => {
      return spaceContext.cma.getEditorInterface(contentTypeId);
    }),
    getWidgets(editorInterface) {
      return WidgetStore.getForEditor(getExtensionLoader(), editorInterface);
    },
    hasAdvancedExtensibility() {
      return AdvancedExtensibilityFeature.isEnabled(spaceContext.organization.sys.id);
    },
    getOpenDoc: makeDocOpener(spaceContext)
  };
}

function makeAssetLoader(spaceContext) {
  const widgets = WidgetStore.getBuiltinsOnly();

  return {
    getEntity: id => fetchEntity(spaceContext, 'Asset', id),
    getContentType: () => assetContentType,
    getEditorInterface: () => {
      // TODO: we compute the editor interface for the Asset Editor.
      // If we would have an endpoint with this data
      // (/spaces/:sid/environments/:eid/asset_content_type/editor_interface)
      // we could potentially enable UI Extensions for assets.
      return EditorInterfaceTransformer.fromAPI(
        assetContentType.data,
        {
          sys: { type: 'EditorInterface' },
          controls: [{ fieldId: 'description', widgetId: 'multipleLine' }]
        },
        widgets
      );
    },
    getWidgets: () => widgets,
    hasAdvancedExtensibility: () => false,
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
  const { type } = entity.data.sys;
  if (type === 'Asset') {
    contentType = assetContentType;
  }

  return deepFreeze({
    id: entity.data.sys.id,
    type,
    contentTypeId: contentType ? contentType.data.sys.id : null,
    // TODO Normalize CT data if this property is used by more advanced
    // services like the 'Document' controller and the 'cfEntityField'
    // directive. Normalizing means that we set external field IDs from
    // internal ones, etc.
    contentType: contentType ? cloneDeep(contentType.data) : null
  });
}

// TODO instead of fetching a client entity object we should only fetch
// the payload
async function fetchEntity(spaceContext, type, id) {
  const space = spaceContext.space;
  const entity = await caseofEq(type, [
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