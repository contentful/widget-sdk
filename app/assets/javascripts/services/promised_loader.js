'use strict';

angular.module('contentful').factory('PromisedLoader', function ($q, $rootScope, cfSpinner) {

  function PromisedLoader() {
    this.inProgress = false;
  }

  PromisedLoader.IN_PROGRESS = 'Already in progress';

  PromisedLoader.prototype = {

    load: function (host, methodName /* args ... */) {
      var deferred = $q.defer();
      var loader = this;
      if (loader.inProgress){
        deferred.reject(PromisedLoader.IN_PROGRESS);
        return deferred.promise;
      }
      var args = _.rest(arguments, 2);

      // TODO
      // Shouldn't inProgress be set to true inside the _.throtte callback?
      // What happens now is that a second request will always either
      // - First is in progress: abort above
      // - First is done: _load has been reset and will be recreated
      // Also, this should be debounce, not throttle
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
