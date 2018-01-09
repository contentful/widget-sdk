import $q from '$q';
import { cloneDeep, mapValues, values } from 'lodash';
import { assign, update } from 'utils/Collections';

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
 * Endpoints are implemented for different resources either as generic
 * collection using `makeGenericEndpoint`, as content entity collections using
 * `makeEntityEndpoint` or as singleton resources using `makeSingletonEndpoint`.
 * See the documentation of these methods for further information.
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
    roles: makeGenericEndpoint(),
    extensions: makeGenericEndpoint(),
    environments: makeGenericEndpoint({
      transformNew: (entity) => {
        return update(entity, ['sys'], (sys) => assign(sys, {
          type: 'Environment',
          status: { sys: { id: 'queued' } }
        }));
      }
    })
  };

  const stores = mapValues(endpoints, (ep) => ep.store);

  function request ({method, path, data, version}) {
    data = cloneDeep(data);
    const [typePath, ...resourcePath] = path;
    if (typePath in endpoints) {
      const endpoint = getEndpoint(endpoints, path);
      return endpoint.request(method, resourcePath, data, version)
        // We isolate the data structure from the response handlers so that
        // changes do not leak into the store
        .then(cloneDeep);
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


/**
 * This object holds the default configuration for resource endpoints.
 * The configuration can be changed by passing an object to the
 * endpoint factories.
 */
const defaultResourceConfig = {
  /**
   * This is called when creating a new resource. It is called with the
   * user provided data. The result is stored and returned as the
   * reponse.
   */
  transformNew: (data) => data
};


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
 *
 * @param {object} resourceConfig
 *   Options that overide `defaultResourceConfig`. See that object for
 *   documentation.
 */
function makeGenericEndpoint (resourceConfig) {
  resourceConfig = assign(defaultResourceConfig, resourceConfig);
  const store = {};

  return {store, request};

  function request (method, path, data, version) {
    const [id] = path;

    if (method === 'GET') {
      if (id) {
        return getResource(store, id);
      } else {
        return $q.resolve({
          items: values(store)
        });
      }
    }

    if (method === 'PUT') {
      return putResource(resourceConfig, store, id, version, data);
    }

    if (method === 'DELETE') {
      return deleteResource(store, id, version);
    }
  }
}


/**
 * Create a {store, request} pair for content entities (content types,
 * entries, assets).
 *
 * The endpoint behaves like a generic resource endpoint. In addition
 * it has the 'published' and 'archived' paths for resource state
 * changes.
 */
function makeEntityEndpoint (resourceConfig) {
  const { store, request: baseRequest } = makeGenericEndpoint(resourceConfig);

  return {store, request};

  function request (method, path, data, version) {
    const [id, state] = path;
    if (state) {
      return updateResourceState(store, method, state, id, version);
    } else {
      return baseRequest(method, path, data, version);
    }
  }
}

function updateResourceState (store, method, state, id, version) {
  const resource = store[id];

  if (!resource) {
    return rejectNotFound();
  }

  if (version !== resource.sys.version) {
    return rejectVersionMismatch();
  }

  resource.sys.version++;

  if (state === 'published') {
    if (method === 'PUT') {
      resource.sys.publishedVersion = version;
    } else if (method === 'DELETE') {
      delete resource.sys.publishedVersion;
    }
  } else if (state === 'archived') {
    if (method === 'PUT') {
      resource.sys.archivedVersion = version;
    } else if (method === 'DELETE') {
      delete resource.sys.archivedVersion;
    }
  }

  return $q.resolve(resource);
}

/**
 * Create a {request, store} pair for a generic singleton Contentful resource
 * endpoint.
 *
 * The singleton resource is always stored with the ID 'default'.
 *
 * Supports the following paths
 * - GET /
 * - PUT /
 */
function makeSingletonEndpoint () {
  const id = 'default';
  const store = {};
  return {store, request};

  function request (method, _path, data, version) {
    if (method === 'GET') {
      return getResource(store, id);
    }
    if (method === 'PUT') {
      return putResource(defaultResourceConfig, store, id, version, data);
    }
  }
}


function getResource (store, id) {
  if (id in store) {
    return $q.resolve(store[id]);
  } else {
    return rejectNotFound();
  }
}


/**
 * Insert or update a resource in the store and return the updated
 * resource.
 *
 * If a resource with the ID does not yet exist we create it. Otherwise
 * we update it. In that case we require the `version` to match. We
 * throw a `VersionMismatch` error otherwise.
 */
function putResource (resourceConfig, store, id, version, data) {
  const resource = store[id];
  if (resource) {
    const sys = resource.sys;
    if (sys.version === version) {
      sys.version++;
      const updatedResource = assign(data, { sys });
      store[id] = updatedResource;
      return $q.resolve(updatedResource);
    } else {
      return rejectVersionMismatch();
    }
  } else {
    const newResource = {
      ...data,
      sys: {
        id: id,
        version: 1
      }
    };
    store[id] = resourceConfig.transformNew(newResource);
    return $q.resolve(newResource);
  }
}


/**
 * Delete a resource from the store and return the deleted resource.
 *
 * The returned playload has the `sys.deletedVersion` set.
 *
 * If the version does not match we return a `VersionMismatch` error.
 * If the resource does not exist we return a `NotFound` error.
 */
function deleteResource (store, id, version) {
  const resource = store[id];

  if (!resource) {
    return rejectNotFound();
  }

  if (resource.sys.version !== version) {
    return rejectVersionMismatch();
  }

  resource.sys.version++;
  resource.sys.deletedVersion = version;
  delete store[id];
  return $q.resolve(resource);
}


function rejectVersionMismatch () {
  return rejectResponse(422, 'Version mismatch');
}

function rejectNotFound () {
  return rejectResponse(404, 'Not found');
}

function rejectResponse (status, message) {
  return $q.reject(Object.assign(new Error(`${status} ${message}`), {
    statusCode: status
  }));
}
