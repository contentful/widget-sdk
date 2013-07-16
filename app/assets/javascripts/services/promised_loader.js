'use strict';

angular.module('contentful').factory('PromisedLoader', function ($q, $rootScope, cfSpinner) {

  // Replacing callbacks with scumbacks
  // Promises to call you back but then doesn't
  // Getting your hopes up again
  // and again
  var brokenPromise = {
    then: doesnt
  };
  function doesnt(callback){
    return brokenPromise;
  }

  function PromisedLoader() {
    this.inProgress = false;
    this.throttled = false;
  }

  PromisedLoader.prototype = {
    _throttle: function() {
      var loader = this;
      if (loader.throttled) return true;
      loader.throttled = true;
      setTimeout(function() {
        loader.throttled = false;
      }, 500);
      return false;
    },

    load: function (host, methodName /* args ... */) {
      var args = _.toArray(arguments).slice(2);
      var loader = this;
      if (loader.inProgress || loader._throttle()) return brokenPromise;

      var deferred = $q.defer();
      var stopSpinner = cfSpinner.start();
      args.push(function callback(err, res, stats) {
        $rootScope.$apply(function () {
          if (err) {
            deferred.reject(err);
          } else {
            if (_.isObject(stats)) _.each(stats, function (stat, name) {
              Object.defineProperty(res, name, {value: stat});
            });
            deferred.resolve(res);
          }
          loader.inProgress = false;
          stopSpinner();
        });
      });
      this.inProgress = true;
      host[methodName].apply(host, args);
      return deferred.promise;
    }
  };

  return PromisedLoader;
});
