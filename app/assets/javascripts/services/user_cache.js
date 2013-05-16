'use strict';
angular.module('contentful').
  service('userCache', function UserCache($browser) {
    var cache = [];
    var inflight = false;
    var pending = [];

    return {
      get: function(bucket, id, callback) {
        if (cache[id])
          return $browser.defer(function() {
            callback(null, cache[id]);
          });

        pending.push(function(err) {
          if (err)
            return callback(err);
          if (!cache[id])
            return callback(new Error('User not found'));
          callback(null, cache[id]);
        });

        if (inflight) return;
        inflight = true;

        bucket.getUsers(null, function(err, users) {
          _.forEach(users, function(user) {
            cache[user.getId()] = user;
          });
          _.forEach(pending, function(cb) {
            cb(err);
          });
          pending = [];
          inflight = false;
        });
      }
    };
  });
