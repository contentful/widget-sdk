import $q from '$q';
import { cloneDeep, assign, mapValues, omit, values } from 'lodash';

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
 * The object created by this factory has two properties: `request()` and
 * `stores`. `request()` is a function with the same interface as the
 * `spaceEndpoint` function. `stores` maps path segments to objects
 * that store the entities for the segment. The objects map IDs to the
 * entity data.
 *
 * Currently covered
 * - /api_keys, /preview_api_keys/ roles
 *   - /  GET collection
 *   - /:id  GET, PUT resource
 * - /entries/:id, /assets/:id
 *   - DELETE
 *   - State changes, i.e. PUT and DELETE to /published and /archived
 * - /ui_config
 *   - GET and PUT
 *
 * TODO Entity stores should provide a better interface to add entities
 * so that we do not need to specifiy the sys properties. E.g.
 *
 *     stores.api_keys.set('xyz', data)
 *     stores.api_keys.get('xyz').sys  // => { id: 'xyz', type: 'DeliveryKey', ... }
 *
 */
export default function create () {
  const endpoints = {
    entries: makeEntityEndpoint('Entry'),
    assets: makeEntityEndpoint('Assets'),
    ui_config: makeSingletonEndpoint(),
    user_ui_config: makeSingletonEndpoint(),
    api_keys: makeGenericEndpoint(),
    preview_api_keys: makeGenericEndpoint(),
    roles: makeGenericEndpoint()
  };

  const stores = mapValues(endpoints, (ep) => ep.store);

  function request ({method, path, data, version}) {
    data = cloneDeep(data);
    const [typePath, id, state] = path;
    if (typePath in endpoints) {
      const endpoint = getEndpoint(endpoints, path);
      return endpoint.request(method, id, state, data, version);
    } else {
      return rejectNotFound();
    }
  }

  return {stores, request};
}

function getEndpoint (endpoints, [typePath, id]) {
  const isUserUIConfig = typePath === 'ui_config' && id === 'me';
  return isUserUIConfig ? endpoints.user_ui_config : endpoints[typePath];
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

/**
 * Create a request handler for a generic Contentful resource collection
 * endpoint.
 *
 * Supports the following paths
 * - GET /
 * - GET /:id
 * - POST /
 * - PUT /:id
 * - DELETE /:id
 */
function makeGenericEndpoint () {
  const store = {};

  return {store, request};

  function request (method, id, _state, data, version) {
    if (method === 'GET') {
      if (id) {
        return getResource(store, id);
      } else {
        return $q.resolve({
          items: values(cloneDeep(store))
        });
      }
    }
    if (method === 'PUT') {
      return putResource(store, id, version, data);
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

/**
 * Create a request handler for a generic singleton Contentful resource
 * endpoint.
 *
 * Supports the following paths
 * - GET /
 * - PUT /
 */
function makeSingletonEndpoint () {
  const id = 'default';
  const store = {};
  return {store, request};

  function request (method, _id, _state, data, version) {
    if (method === 'GET') {
      return getResource(store, id);
    }
    if (method === 'PUT') {
      return putResource(store, id, version, data);
    }
  }
}


function getResource (store, id) {
  if (id in store) {
    return $q.resolve(cloneDeep(store[id]));
  } else {
    return rejectNotFound();
  }
}


function putResource (store, id, version, data) {
  let item = store[id];
  if (!item) {
    item = {
      sys: {
        id: id,
        version: 1
      }
    };
    store[id] = item;
  } else if (item.sys.version !== version) {
    return rejectVersionMismatch();
  }

  Object.assign(item, omit(data, 'sys'));
  item.sys.version++;
  return $q.resolve(cloneDeep(item));
}


function rejectVersionMismatch () {
  return rejectResponse(422, 'Version mismatch');
}

function rejectNotFound () {
  return rejectResponse(404, 'Not found');
}

function rejectResponse (status, message) {
  return $q.reject(assign(new Error(`${status} ${message}`), {
    statusCode: status
  }));
}
