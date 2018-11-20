import { pick } from 'lodash';
import $q from '$q';

/**
 * @ngdoc service
 * @name data/CMA/ApiKeyRepo
 */

/**
 * @ngdoc method
 * @name data/CMA/ApiKeyRepo#default
 * @description
 * Create an API key repository object.
 *
 * An API key has the string properties `name`, `description`, and
 * `accessToken`. It also has a `preview_api_key` property that holds a
 * link to a preview API key.
 *
 * The API keys returned from `get()` and `save()` have their
 * preview key resolved..
 *
 * The `getAll()` function is cached. Calling it twice yields the same
 * result. The cache can be refreshed by calling `refresh()`. The
 * preview key links are not resolved for `getAll()`.
 *
 * @param {data/Endpoint} spaceEndpoint
 *   Function that sends requests to space ednpoints. Should be
 *   constructed with the 'data/Endpoint.createSpaceEndpoint()' service.
 * @returns {ApiKeyRepo}
 */
export default function create(spaceEndpoint) {
  // Promise to cached list of deliver keys
  let deliveryKeys = null;

  return {
    get,
    save,
    remove,
    create,
    getAll,
    refresh
  };

  function get(id) {
    return spaceEndpoint({
      method: 'GET',
      path: ['api_keys', id]
    }).then(resolvePreviewKey);
  }

  function create(name, description) {
    return getNewName(name)
      .then(uniqueName => {
        return spaceEndpoint({
          method: 'POST',
          path: ['api_keys'],
          data: { name: uniqueName, description }
        });
      })
      .then(data => {
        refresh();
        return resolvePreviewKey(data);
      });
  }

  function save(data) {
    const id = data.sys.id;
    const version = data.sys.version;
    const payload = pick(data, ['name', 'description', 'environments']);

    return spaceEndpoint({
      method: 'PUT',
      path: ['api_keys', id],
      data: payload,
      version
    }).then(data => {
      refresh();
      return resolvePreviewKey(data);
    });
  }

  function remove(id) {
    return spaceEndpoint({
      method: 'DELETE',
      path: ['api_keys', id]
    }).then(() => {
      refresh();
    });
  }

  function refresh() {
    deliveryKeys = spaceEndpoint({
      method: 'GET',
      path: ['api_keys'],
      // TODO Maximum limit allowed by the API. We should paginate
      // this.
      query: { limit: '100' }
    }).then(response => response.items);
    return deliveryKeys;
  }

  function getAll() {
    return deliveryKeys || refresh();
  }

  /**
   * Resolves the link in `apiKey.preview_api_key` and replaces it with
   * the key data. Returns the mutated object.
   */
  function resolvePreviewKey(apiKey) {
    if (apiKey.preview_api_key) {
      return getPreviewKey(apiKey.preview_api_key.sys.id).then(previewKey => {
        apiKey.preview_api_key = previewKey;
        return apiKey;
      });
    } else {
      return $q.resolve(apiKey);
    }
  }

  function getPreviewKey(id) {
    return spaceEndpoint({
      method: 'GET',
      path: ['preview_api_keys', id]
    });
  }

  /**
   * Get an API key name that is not taken yet by appending a number to
   * the base name.
   */
  function getNewName(base) {
    let i = 1;
    return getAll().then(keys => {
      const names = keys.map(k => k.name);
      /* eslint no-constant-condition: off */
      while (true) {
        const name = base + ' ' + i;
        if (names.indexOf(name) > -1) {
          i += 1;
        } else {
          return name;
        }
      }
    });
  }
}
