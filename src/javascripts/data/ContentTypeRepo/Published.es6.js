import { cloneDeep, get, sortBy } from 'lodash';
import notification from 'notification';
import logger from 'logger';
import $q from '$q';
import Store from 'data/StreamHashSet';
import { deepFreeze } from 'utils/Freeze.es6';
import * as K from 'utils/kefir.es6';

/**
 * @ngdoc type
 * @module cf.data
 * @name Data/ContentTypeRepo/Published
 * @description
 * Repository for managing published content types.
 *
 * @usage[js]
 * var Repo = require('data/ContentTypeRepo/Published');
 * var repo = Repo.create(space);
 */

/**
 * @param {Client.Space} space  Space instance from the client.
 */
export function create(space) {
  const store = Store.create();

  /**
   * @ngdoc property
   * @name Data.ContentTypeRepo.Published#items$
   * @type {Property<Data.ContentType[]>}
   * @description
   * Property holding an array of data objects of published CTs:
   * - the items in the array will be deeply frozen to prevent mutation
   * - the items are sorted by CT name
   */
  const items$ = store.items$.map(cts =>
    sortBy(cts.map(ct => deepFreeze(cloneDeep(ct.data))), ct => ct.name && ct.name.toLowerCase())
  );

  // requesting[id] holds a promise for the content type if we are
  // already requesting it.
  const requesting = {};

  return {
    items$,
    get,
    fetch,
    publish,
    unpublish,
    refresh,
    refreshBare,
    getAllBare: () => K.getValue(items$)
  };

  /**
   * @ngdoc method
   * @name Data.ContentTypeRepo.Published#get
   * @description
   * Get a content type instance by ID if it is already loaded.
   *
   * If the content type is not yet loaded the method returns `undefined` but
   * initializes an API request to try to fetch the content type in the
   * background.
   *
   * @param {string} id
   * @returns {Client.ContentType?}
   */
  function get(id) {
    // TODO this is deprecated and only for legacy code. We should throw an
    // error instead.
    if (!id) {
      return null;
    }

    const ct = store.get(id);

    if (!ct && !requesting[id]) {
      fetch(id);
      return;
    } else {
      return ct;
    }
  }

  /**
   * @ngdoc method
   * @name Data.ContentTypeRepo.Published#fetch
   * @description
   * Get a content type instance by ID if it is already loaded or fetch the CT
   * from the API.
   *
   * Returns null if the content type does not exist.
   *
   * @param {string} id
   * @returns {Promise<Client.ContentType?>}
   */
  function fetch(id) {
    const ct = store.get(id);
    if (ct) {
      return $q.resolve(ct);
    } else {
      if (!requesting[id]) {
        requesting[id] =
          // TODO We should only request the one content type. The
          // client library unfortunately does not support this.
          refresh().then(() => store.get(id));
      }
      return requesting[id];
    }
  }

  /**
   * @ngdoc method
   * @name Data.ContentTypeRepo.Published#publish
   * @description
   * Publishes the given content type, adds it to the store and returns the
   * published content type.
   *
   * @param {string} Client.ContentType
   * @returns {Promise<Client.ContentType>}
   */
  function publish(contentType) {
    return contentType.publish().then(published => {
      store.add(published);
      return published;
    });
  }

  /**
   * @ngdoc method
   * @name Data.ContentTypeRepo.Published#unpublish
   * @description
   * Unpublishes the given content type and removes it from the store.
   *
   * @param {string} Client.ContentType
   * @returns {Promise<void>}
   */
  function unpublish(contentType) {
    return contentType.unpublish().then(store.remove);
  }

  /**
   * @ngdoc method
   * @name Data.ContentTypeRepo.Published#refresh
   * @description
   * Fetch all content types and return them.
   *
   * If the HTTP request fails we show an application notification and reject
   * the promise.
   *
   * @returns {Promise<API.ContentType[]>}
   */
  function refreshBare() {
    return refresh().then(cts => cts.map(ct => deepFreeze(cloneDeep(ct.data))));
  }

  /**
   * @ngdoc method
   * @name Data.ContentTypeRepo.Published#refresh
   * @description
   * Similar to 'refreshBare()' but returns an array of client
   * instances instead of only the data.
   *
   * @deprecated Please use 'refreshBare()' instead
   *
   * @returns {Promise<Client.ContentType[]>}
   */
  // TODO we should throttle this function so that multiple
  // subsequent calls to `fetch()` do not trigger multiple requests.
  function refresh() {
    return space.getPublishedContentTypes({ limit: 1000 }).then(contentTypes => {
      contentTypes = removeDeleted(contentTypes);
      store.reset(contentTypes);
      return contentTypes;
    }, handleReloadError);
  }
}

function removeDeleted(contentTypes) {
  return contentTypes.filter(ct => !ct.isDeleted());
}

function handleReloadError(err) {
  const message = get(err, 'body.message');
  if (message) {
    notification.warn(message);
  } else {
    notification.warn('Could not get published content types');
    logger.logServerError('Could not get published Content Types', { error: err });
  }
  return $q.reject(err);
}
