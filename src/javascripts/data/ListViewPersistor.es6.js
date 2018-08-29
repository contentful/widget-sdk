import qs from 'qs';
import $q from '$q';
import $location from '$location';
import { getStore } from 'TheStore';
import { omit, isEmpty, isObject } from 'lodash';
import { serialize, unserialize } from 'data/ViewSerializer';

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
 * @param {string} spaceId
 * @param {ViewMigrator?} viewMigrator
 * @returns {ListViewPersistor}
 */
export default function create(spaceId, viewMigrator, entityType) {
  const key = `lastFilterQueryString.${entityType}.${spaceId}`;
  const localStorage = getStore().forKey(key);

  return { read, save };

  function save(view) {
    const viewData = serialize(omitUIConfigOnlyViewProperties(view));
    localStorage.set(viewData);
    $location.search(prepareQueryString(viewData));
    $location.replace();
  }

  function read() {
    const currentQS = $location.search();
    const qs = isEmpty(currentQS) ? getPreviousQS() : currentQS;
    return fromStorageFormat(qs);
  }

  function getPreviousQS() {
    return localStorage.get() || {};
  }

  function fromStorageFormat(viewData) {
    const view = omitUIConfigOnlyViewProperties(unserialize(viewData));
    return viewMigrations(view);
  }

  function viewMigrations(view) {
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
    if (viewMigrator) {
      const isAssetsView = entityType === 'assets';
      return viewMigrator.migrateView(view, isAssetsView);
    }

    return $q.resolve(view);
  }
}

function omitUIConfigOnlyViewProperties(view) {
  return omit(view, ['title', '_legacySearchTerm']);
}

function prepareQueryString(viewData) {
  const qsObject = Object.keys(viewData)
    .filter(key => key.charAt(0) !== '_')
    .reduce((acc, key) => {
      acc[key] = viewData[key];
      return acc;
    }, {});

  // We use the "repeat" array format option so:
  // stringify({x: [1, 2]}) // results in: 'x=1&x=2'
  //
  // This format is used in entity list query strings
  // for historical reasons.
  return qs.stringify(qsObject, { arrayFormat: 'repeat' });
}
