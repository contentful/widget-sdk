import querystring from 'querystring';
import $location from '$location';
import TheStore from 'TheStore';
import flatten from 'libs/flat';
import {omit, omitBy, isEmpty, isObject, find} from 'lodash';

/**
 * Create a persitory for entity views.
 *
 * Views are persisted to the location query string and local storage.
 * They are also read from both with the query string taking
 * precedence.
 *
 * This module is used in the ListViewsController and The
 * ContentTypeListController.
 *
 * TODO we need to separate the serialization logic for content types
 * and content.
 *
 * TODO test collection serialization
 */
export default function create (spaceId, entityType) {
  const key = `lastFilterQueryString.${entityType}.${spaceId}`;
  const localStorage = TheStore.forKey(key);

  return {read, save};

  function save (view) {
    const viewData = toStorageFormat(view);
    localStorage.set(viewData);
    $location.search(prepareQueryString(viewData));
    $location.replace();
  }

  function read (collections) {
    const currentQS = $location.search();
    const previousQS = localStorage.get() || {};
    const qs = isEmpty(currentQS) ? previousQS : currentQS;
    return fromStorageFormat(qs, collections);
  }
}

function toStorageFormat (view) {
  const storedView = view.collection
    ? collectionToStorageFormat(view)
    : omit(view, ['title']);

  return flatten(omitBy(storedView, (item) => {
    return item === undefined || item === null || item === '';
  }), {safe: true});
}

function collectionToStorageFormat (view) {
  return {
    _v: 1, // Include version for migrations in the future
    collectionId: view.collection.id,
    order: view.order,
    displayedFieldsIds: view.displayedFieldIds
  };
}

function prepareQueryString (viewData) {
  const keys = Object.keys(viewData)
    .filter(key => key.charAt(0) !== '_');

  return querystring.stringify(keys.reduce((acc, key) => {
    acc[key] = viewData[key];
    return acc;
  }, {}));
}

function fromStorageFormat (stored, collections) {
  const view = flatten.unflatten(stored, {safe: true});

  return view.collectionId
    ? collectionFromStorageFormat(view, collections)
    : viewFromStorageFormat(view);
}

function collectionFromStorageFormat (view, collections) {
  return {
    collection: find(collections, {id: view.collectionId}),
    order: view.order,
    displayedFieldsIds: view.displayedFieldIds
  };
}

function viewFromStorageFormat (view) {
  if (!isObject(view)) {
    return {};
  }

  // For "contentTypeHidden" we cast a string value to a boolean:
  // - An undefined value is retained.
  // - The string "false" is casted to false.
  // - Everything else is casted to true.
  const contentTypeHidden = view.contentTypeHidden;
  if (typeof contentTypeHidden !== 'undefined') {
    view.contentTypeHidden = contentTypeHidden.toString() !== 'false';
  }

  // Migration of faulty query strings that were introduced
  // accidentially some time ago.
  if (isObject(view.order)) {
    delete view.order.sys;
    delete view.order.isSys;
  }

  return view;
}
