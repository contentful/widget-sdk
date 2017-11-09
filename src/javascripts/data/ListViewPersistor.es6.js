import querystring from 'querystring';
import $q from '$q';
import $location from '$location';
import TheStore from 'TheStore';
import {omit, isEmpty, isObject} from 'lodash';
import {textQueryToUISearch} from 'search/TextQueryConverter';
import {serialize, unserialize} from 'data/ViewSerializer';

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
 * @param {Space} space
 * @param {ContentTypeRepo} contentTypes
 * @returns {ListViewPersistor}
 */
export default function create (space, contentTypes, entityType) {
  const key = `lastFilterQueryString.${entityType}.${space.getId()}`;
  const localStorage = TheStore.forKey(key);

  return {read, save};

  function save (view) {
    const viewData = serialize(omit(view, ['title']));
    localStorage.set(viewData);
    $location.search(prepareQueryString(viewData));
    $location.replace();
  }

  function read () {
    const currentQS = $location.search();
    const qs = isEmpty(currentQS) ? getPreviousQS() : currentQS;
    return fromStorageFormat(qs);
  }

  function getPreviousQS () {
    return localStorage.get() || {};
  }

  function fromStorageFormat (viewData) {
    const view = unserialize(viewData);
    return viewMigrations(view);
  }

  function viewMigrations (view) {
    if (!isObject(view)) {
      return $q.resolve({});
    }

    // For "contentTypeHidden" we cast a string value to a boolean:
    // - An undefined value is retained.
    // - The string "false" is casted to false.
    // - Everything else is casted to true.
    const contentTypeHidden = view.contentTypeHidden;
    if (contentTypeHidden !== undefined) {
      view.contentTypeHidden = contentTypeHidden.toString() !== 'false';
    }

    // Migration of faulty query strings that were introduced
    // accidentally some time ago.
    if (isObject(view.order)) {
      delete view.order.sys;
      delete view.order.isSys;
    }

    // Migration of pure text queries to new search ui's format.
    if (view.searchTerm) {
      const contentType = getViewContentTypeOrNull(view.contentTypeId);
      return textQueryToUISearch(space, contentType, view.searchTerm)
      .then((search) => {
        view.searchText = search.searchText;
        view.searchFilters = search.searchFilters;
        delete view.searchTerm;
        return view;
      });
    }

    return $q.resolve(view);
  }

  function getViewContentTypeOrNull (contentTypeId) {
    return contentTypeId
      ? contentTypes.get(contentTypeId)
      : null;
  }
}

function prepareQueryString (viewData) {
  const keys = Object.keys(viewData)
    .filter(key => key.charAt(0) !== '_');

  return querystring.stringify(keys.reduce((acc, key) => {
    acc[key] = viewData[key];
    return acc;
  }, {}));
}
