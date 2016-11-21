angular.module('contentful/test')
/**
 * Mock implementation for the 'spaceEndpoint' that simulates a subset
 * of the CMA.
 *
 * Currently covered
 * - (Un)publishing entities
 * - (Un)archiving entities
 * - Deleting entities
 */
.factory('mocks/spaceEndpoint', ['require', function (require) {
  const $q = require('$q');

  return {create};

  function create () {
    // Maps entries to their payload
    const store = {};

    return function ({method, path, version}) {
      const [typePath, id, state] = path.split('/');
      const type =
        typePath === 'entries' ? 'Entry'
        : typePath === 'assets' ? 'Asset'
        : undefined;

      if (!type) {
        return $q.reject(_.extend(new Error('404 Not found'), {
          statusCode: 404
        }));
      }

      const key = type + id;
      let sys;
      if (key in store) {
        sys = store[key].sys;
      } else {
        sys = {
          id: id,
          type: type,
          version: version
        };
        store[key] = {sys};
      }

      if (version !== sys.version) {
        return $q.reject(_.extend(new Error('422 Version mismatch'), {
          statusCode: 422
        }));
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
    };
  }
}]);
