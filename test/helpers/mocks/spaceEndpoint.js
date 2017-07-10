angular.module('contentful/test')

/**
 * Mock implementation for the 'spaceEndpoint' that simulates a subset
 * of the CMA.
 *
 * ~~~js
 * const api = createMockEndpoint()
 * api.stores.api_keys['ABC'] = { name: 'my key' }
 * yield api.request({ method: 'GET', path: ['api_keys', 'ABC'])
 * // => {name : 'my key'}
 * ~~~
 *
 * The object created by the factory has to properties: `request()` and
 * `stores`. `request()` is a function with the same interface as the
 * `spaceEndpoint` function. `stores` maps path segments to objects
 * that store the entities for the segment. The objects map IDs to the
 * entity data.
 *
 * Currently covered
 * - /api_keys, /preview_api_keys
 *   - /  GET collection
 *   - /:id  GET, PUT resource
 * - /entries/:id, /assets/:id
 *   - DELETE
 *   - State changes, i.e. PUT and DELETE to /published and /archived
 */
.factory('mocks/spaceEndpoint', ['require', function (require) {
  const $q = require('$q');

  return {create};

  function create () {
    const endpoints = {
      entries: makeEntityEndpoint('Entry'),
      assets: makeEntityEndpoint('Assets'),
      api_keys: makeGenericEndpoint('api_keys'),
      preview_api_keys: makeGenericEndpoint('preview_api_keys')
    };

    const stores = _.mapValues(endpoints, (ep) => ep.store);

    function request ({method, path, data, version}) {
      data = _.cloneDeep(data);
      const [typePath, id, state] = path;
      if (typePath in endpoints) {
        return endpoints[typePath].request(method, id, state, data, version);
      } else {
        return rejectNotFound();
      }
    }

    return {stores, request};
  }

  function makeEntityEndpoint (type) {
    const store = {};

    return {store, request};

    function request (method, id, state, _data, version) {
      let sys;
      if (id in store) {
        sys = store[id].sys;
      } else {
        sys = {
          id: id,
          type: type,
          version: version
        };
        store[id] = {sys};
      }

      if (version !== sys.version) {
        return rejectVersionMismatch();
      }

      sys.version++;

      if (state === 'published') {
        if (method === 'PUT') {
          sys.publishedVersion = version;
        } else if (method === 'DELETE') {
          delete sys.publishedVersion;
        }
      } else if (state === 'archived') {
        if (method === 'PUT') {
          sys.archivedVersion = version;
        } else if (method === 'DELETE') {
          delete sys.archivedVersion;
        }
      } else if (state === undefined) {
        if (method === 'DELETE') {
          sys.deletedVersion = version;
        }
      }
      return $q.resolve({sys});
    }
  }

  function makeGenericEndpoint (_type) {
    const store = {};

    return {store, request};

    function request (method, id, _state, data, version) {
      if (method === 'GET') {
        if (id) {
          if (id in store) {
            return $q.resolve(_.cloneDeep(store[id]));
          } else {
            return rejectNotFound();
          }
        } else {
          return $q.resolve({
            items: _.values(_.cloneDeep(store))
          });
        }
      }
      if (method === 'PUT') {
        const entry = store[id];
        if (entry.sys.version !== version) {
          return rejectVersionMismatch();
        }

        Object.assign(store[id], _.omit(data, 'sys'));
        store[id].sys.version++;
        return $q.resolve(_.cloneDeep(store[id]));
      }

      if (method === 'DELETE') {
        if (id in store) {
          delete store[id];
          return $q.resolve();
        } else {
          return rejectNotFound();
        }
      }
    }
  }

  function rejectVersionMismatch () {
    return rejectResponse(422, 'Version mismatch');
  }

  function rejectNotFound () {
    return rejectResponse(404, 'Not found');
  }

  function rejectResponse (status, message) {
    return $q.reject(_.assign(new Error(`${status} ${message}`), {
      statusCode: status
    }));
  }
}]);
