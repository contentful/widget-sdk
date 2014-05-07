'use strict';

angular.module('contentful').factory('PromisedLoader', function ($q, $rootScope, cfSpinner) {

  function PromisedLoader() {
    this.inProgress = false;
    this.throttled = false;
  }

  PromisedLoader.prototype = {

    load: function (host, methodName /* args ... */) {
      var deferred = $q.defer();
      var args = _.toArray(arguments).slice(2);
      var loader = this;
      if (loader.inProgress){
        deferred.reject('Already in progress');
        return deferred.promise;
      }

      loader.inProgress = true;
      if(!loader._load) loader._load = _.throttle(function (host, methodName, args) {
        host[methodName].apply(host, args);
      }, 500);

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
          delete loader._load;
          stopSpinner();
        });
      });
      loader._load(host, methodName, args);
      return deferred.promise;
    }

  };

  return PromisedLoader;
});
