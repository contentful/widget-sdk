import {find, isPlainObject, cloneDeep} from 'lodash';
import assetEditorInterface from 'data/editingInterfaces/asset';
import {caseof as caseofEq} from 'libs/sum-types/caseof-eq';
import {deepFreeze} from 'utils/DeepFreeze';

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
export function loadEntry (spaceContext, id) {
  const context = {};

  return fetchEntity(spaceContext, 'Entry', id)
  .then((entity) => {
    context.entity = entity;
    const ctId = entity.data.sys.contentType.sys.id;
    return spaceContext.publishedCTs.fetch(ctId);
  }).then((ct) => {
    context.contentType = ct;
    return spaceContext.editingInterfaces.get(ct.data);
  }).then((ei) => {
    context.fieldControls = spaceContext.widgets.buildRenderable(ei.controls);
    context.entityInfo = makeEntityInfo(context.entity, context.contentType);
    return context;
  });
}


/**
 * @ngdoc method
 * @name app/entity_editor/DataLoader#loadEntryWithDoc
 * @description
 * Same as `loadEntry()` but also loads the entry document from the connection
 * pool (see the 'data/sharejs/DocumentPool' module). The promise is resolved
 * then the document connection has been established.
 * @param {SpaceContext} spaceContext
 * @param {string} id
 * @param {API.User} user
 * @param {Property<void>} lifeline
 * @returns {Promise<object>}
 */
export function loadEntryWithDoc (spaceContext, id, user, lifeline) {
  return loadEntry(spaceContext, id)
  .then((context) => {
    return spaceContext.docPool.load(
      context.entity,
      context.contentType,
      user,
      lifeline
    ).then((doc) => {
      context.doc = doc;
      return context;
    });
  });
}


/**
 * @ngdoc method
 * @name app/entity_editor/DataLoader#loadAsset
 * @param {SpaceContext} spaceContext
 * @param {string} id
 * @returns {object}
 */
export function loadAsset (spaceContext, id) {
  const context = {};
  return fetchEntity(spaceContext, 'Asset', id)
  .then((entity) => {
    context.entity = entity;
    context.fieldControls =
      spaceContext.widgets.buildRenderable(assetEditorInterface.widgets);
    context.entityInfo = makeEntityInfo(entity);
    return context;
  });
}


// TODO instead of fetching a client entity object we should only fetch
// the payload
function fetchEntity (spaceContext, type, id) {
  const space = spaceContext.space;
  return caseofEq(type, [
    ['Entry', () => space.getEntry(id)],
    ['Asset', () => space.getAsset(id)]
  ]).then((entity) => {
    sanitizeEntityData(entity.data, space.getPrivateLocales());
    return entity;
  });
}


function makeEntityInfo (entity, contentType) {
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


/**
 * Given an entry payload we make sure that the following holds.
 *
 * - 'data.fields' is always an object
 * - 'data.fields[fieldId]' is always an object
 * - The keys of 'data.fields[fieldId]' are all valid locales
 */
function sanitizeEntityData (data, locales) {
  if (!isPlainObject(data.fields)) {
    data.fields = {};
  }
  Object.keys(data.fields).forEach((fieldId) => {
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
function deleteUnusedLocales (fieldValues, locales) {
  Object.keys(fieldValues).forEach((internalCode) => {
    if (!find(locales, { internal_code: internalCode })) {
      delete fieldValues[internalCode];
    }
  });
}
