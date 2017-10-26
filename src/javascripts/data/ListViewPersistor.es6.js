import querystring from 'querystring';
import $q from '$q';
import $location from '$location';
import TheStore from 'TheStore';
import flatten from 'libs/flat';
import {omit, omitBy, isEmpty, isObject} from 'lodash';
import {textQueryToUISearch} from 'search/TextQueryConverter';

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
export default function create (space, entityType) {
  const key = `lastFilterQueryString.${entityType}.${space.getId()}`;
  const localStorage = TheStore.forKey(key);

  return {read, save};

  function save (view) {
    console.log('SAVE query', view);
    return; // TODO:danwe
    const viewData = toStorageFormat(view);
    localStorage.set(viewData);
    $location.search(prepareQueryString(viewData));
    $location.replace();
  }

  function read () {
    const currentQS = $location.search();
    const previousQS = localStorage.get() || {}; // TODO: don't call get if no need!
    const qs = isEmpty(currentQS) ? previousQS : currentQS;
    return fromStorageFormat(qs).then((query) => {
      console.log('READ query', qs, query);
      return query;
    });
  }

  function fromStorageFormat (stored) {
    let view = flatten.unflatten(stored, {safe: true});
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
    if (contentTypeHidden !== undefined) {
      view.contentTypeHidden = contentTypeHidden.toString() !== 'false';
    }

    // Migration of faulty query strings that were introduced
    // accidentally some time ago.
    if (isObject(view.order)) {
      delete view.order.sys;
      delete view.order.isSys;
    }

    // Migration of pure text queries to new search ui powered format.
    if (view.searchTerm) {
      return getViewContentTypeOrNull(view).then((contentType) => {
        console.log('CT', contentType);
        return textQueryToUISearch(space, contentType, view.searchTerm).then((search) => {
          view.searchText = search.searchText;
          view.searchFilters = search.searchFilters;
          delete view.searchTerm;
          return view;
        });
      });
    }

    return $q.resolve(view);
  }

  function getViewContentTypeOrNull (view) {
    return view.contentTypeId
      ? space.getContentType(view.contentTypeId)
      : $q.resolve(null);
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

function structuredSearchFromTextQuery (textQuery) {
  const search = parseTextQuery(view.searchTerm);
}
