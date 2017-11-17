'use strict';

angular.module('cf.data')
/**
 * @ngdoc service
 * @module cf.data
 * @name data/userCache
 * @description
 * Creates a user cache for a space.
 *
 * Users are fetched only once, but we use the `FetchAll` utility so multiple
 * requests can be fired. All further calls to `get` and `getAll` will use
 * the first result.
 *
 * @usage[js]
 * var createCache = require('data/userCache')
 * var users = createCache(spaceContext.endpoint)
 *
 * // triggers request
 * users.getAll()
 * .then(function (users) {
 *   // users = [User, User]
 * })
 *
 * // does not trigger request
 * users.get('user_id')
 * .then(function (user) {
 *   // ...
 * })
 */
.factory('data/userCache', ['require', function (require) {
  var memoize = require('utils/memoize');
  var fetchAll = require('data/CMA/FetchAll').fetchAll;

  return function createCache (endpoint) {
    var getUserMap = createUserFetcher(endpoint);

    var getUserList = memoize(function () {
      return getUserMap().then(_.values);
    });

    return {
      getAll: getUserList,
      get: function (id) {
        return getUserMap().then(function (users) {
          return users[id];
        });
      }
    };
  };

  function createUserFetcher (endpoint) {
    return memoize(function () {
      return fetchAll(endpoint, ['users'], 100).then(mapUsersById);
    });
  }

  function mapUsersById (users) {
    return _.transform(users, function (map, user) {
      map[user.sys.id] = user;
    }, {});
  }
}]);
