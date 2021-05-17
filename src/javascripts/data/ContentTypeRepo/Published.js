import { cloneDeep, get, sortBy } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import { deepFreeze } from 'utils/Freeze';
import * as K from 'core/utils/kefir';
import * as Store from 'data/streamHashSet';

/**
 * @ngdoc type
 * @module cf.data
 * @name Data/ContentTypeRepo/Published
 * @description
 * Repository for managing published content types.
 *
 * @usage[js]
 * var Repo = require('data/ContentTypeRepo/Published');
 * var repo = Repo.create(cmaClient);
 */

/**
 * @param {CmaClient} cmaClient  flat CMA client instance
 */
export function create(cmaClient) {
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
  const items$ = store.items$.map((cts) =>
    sortBy(
      cts.map((ct) => deepFreeze(cloneDeep(ct))),
      (ct) => ct.name && ct.name.toLowerCase()
    )
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
    getAllBare: () => K.getValue(items$),
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
      return Promise.resolve(ct);
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
    const { spaceId, environmentId } = cmaClient.raw.getDefaultParams();
    // TODO: cmaClient.contentType.publish should accept headers, until then we use .raw
    return cmaClient.raw
      .put(
        `/spaces/${spaceId}/environments/${environmentId}/content_types/${contentType.sys.id}/published`,
        contentType,
        {
          headers: {
            'x-contentful-skip-transformation': true,
            'x-contentful-version': contentType.sys.version,
          },
        }
      )
      .then((published) => {
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
    return cmaClient.contentType
      .unpublish({ contentTypeId: contentType.sys.id })
      .then(store.remove);
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
    return refresh().then((cts) => cts.map((ct) => deepFreeze(cloneDeep(ct))));
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
    const { spaceId, environmentId } = cmaClient.raw.getDefaultParams();
    return cmaClient.raw
      .get(`/spaces/${spaceId}/environments/${environmentId}/public/content_types?limit=1000`, {
        headers: { 'x-contentful-skip-transformation': true },
      })
      .then(({ items: contentTypes }) => {
        contentTypes = removeDeleted(contentTypes);
        store.reset(contentTypes);
        return contentTypes;
      }, handleReloadError);
  }
}

function removeDeleted(contentTypes) {
  return contentTypes.filter((ct) => ct && !ct.sys.deletedAtVersion);
}

function handleReloadError(err) {
  const message = get(err, 'body.message');
  if (message) {
    Notification.error(message);
  } else {
    Notification.error('Could not get published content types');
  }
  return Promise.reject(err);
}
