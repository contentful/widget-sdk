'use strict';
angular.module('contentful').
  service('userCache', ['$browser', '$q', function UserCache($browser, $q) {
    var cache = {};
    var inflight = false;
    var pending = [];

    return {
      getAll: function(space) {
        if (!_.isEmpty(cache)) return $q.when(cache);

        if (inflight) return inflight.promise;

        inflight = $q.callback();
        space.getUsers(null, inflight);
        return inflight.promise.then(function (users) {
          _.forEach(users, function(user) {
            cache[user.getId()] = user;
          });
          inflight = false;
        });
      },

      get: function (space, id) {
        if (cache[id]) return $q.when(cache[id]);

        var request = $q.defer();
        pending.push(request);
        request.promise.then(function () {
          if (!cache[id]) return $q.reject(new Error('User not found'));
          return cache[id];
        });

        return this.getAll(space).then(function () {
          _.invoke(pending, 'resolve');
          pending = [];
        }, function (err) {
          _.invoke(pending, 'reject', err);
          pending = [];
        });
      },
    };
  }]);
