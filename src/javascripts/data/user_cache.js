'use strict';

angular.module('cf.data')
/**
 * @ngdoc service
 * @module cf.data
 * @name data/userCache
 * @description
 * Creates a user cache for a space.
 *
 * Only one request to the users API is sent. All further calls use
 * the first result.
 *
 * @usage[js]
 * var createCache = $injector.get('data/userCache')
 * var users = createCache(space)
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
.factory('data/userCache', [function () {

  return function createCache (space) {
    var getUserMap = createUserFetcher(space);

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

  function createUserFetcher (space) {
    return memoize(function () {
      return space.getUsers().then(mapUsersById);
    });
  }

  function mapUsersById (users) {
    return _.transform(users, function (map, user) {
      map[user.getId()] = user;
    }, {});
  }

  function memoize (fn) {
    var result;
    var called = false;
    return function () {
      if (!called) {
        result = fn();
        called = true;
      }
      return result;
    };
  }
}]);
