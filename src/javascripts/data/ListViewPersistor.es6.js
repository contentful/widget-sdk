import querystring from 'querystring';
import $location from '$location';
import TheStore from 'TheStore';
import dotty from 'libs/dotty';
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
 *
 * TODO test collection serialization
 */
export default function create (spaceId, entityType) {
  const key = `lastFilterQueryString.${entityType}.${spaceId}`;
  const localStorage = TheStore.forKey(key);

  return {
    read: read,
    save: save
  };

  function save (view) {
    const viewData = toStorageFormat(view);
    localStorage.set(viewData);
    const qs = querystring.stringify(viewData);
    $location.search(qs);
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
  if (view.collection) {
    view = {
      // Format version so that we can migrate stored data
      // TODO omit this from query string
      _v: 1,
      collectionId: view.collection.id,
      order: view.order,
      displayedFieldsIds: view.displayedFieldIds
    };
  } else {
    view = omit(view, ['title']);
  }

  view = omitBy(view, (item) => {
    return item === undefined || item === null || item === '';
  });

  return dotty.flatten(view);
}


function fromStorageFormat (stored, collections) {
  const view = dotty.transform(stored);

  if (view.collectionId) {
    return {
      collection: collections.find((c) => c.id === view.collectionId),
      order: view.order,
      displayedFieldsIds: view.displayedFieldIds
    };
  } else {
    stringToBool(view, 'contentTypeHidden');
    // migration of faulty query strings
    if (view && isObject(view.order)) {
      delete view.order.sys;
      delete view.order.isSys;
    }

    return view;
  }
}


/**
 * Casts a string value to a boolean at the given path.
 *
 * An undefined value is retained. The string 'false' is cast to false.
 * Everything else to true.
 */
function stringToBool (obj, path) {
  const value = dotty.get(obj, path, undefined);
  if (value !== undefined) {
    dotty.put(obj, path, value.toString() !== 'false');
  }
}
