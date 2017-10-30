import querystring from 'querystring';
import $location from '$location';
import TheStore from 'TheStore';
import flatten from 'libs/flat';
import {omit, omitBy, isEmpty, isObject} from 'lodash';

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
 */
export default function create (spaceId, entityType) {
  const key = `lastFilterQueryString.${entityType}.${spaceId}`;
  const localStorage = TheStore.forKey(key);

  return {read, save};

  function save (view) {
    return;
    /* eslint-disable no-unreachable */
    const viewData = toStorageFormat(view);
    localStorage.set(viewData);
    $location.search(prepareQueryString(viewData));
    $location.replace();
    /* eslint-enable no-unreachable */
  }

  function read () {
    return {};
    /* eslint-disable no-unreachable */
    const currentQS = $location.search();
    const previousQS = localStorage.get() || {};
    const qs = isEmpty(currentQS) ? previousQS : currentQS;
    return fromStorageFormat(qs);
    /* eslint-enable no-unreachable */
  }
}

function toStorageFormat (view) {
  const storedView = omit(view, ['title']);

  return flatten(omitBy(storedView, (item) => {
    return item === undefined || item === null || item === '';
  }), {safe: true});
}

function prepareQueryString (viewData) {
  const keys = Object.keys(viewData)
    .filter(key => key.charAt(0) !== '_');

  return querystring.stringify(keys.reduce((acc, key) => {
    acc[key] = viewData[key];
    return acc;
  }, {}));
}

function fromStorageFormat (stored) {
  const view = flatten.unflatten(stored, {safe: true});

  return viewFromStorageFormat(view);
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
