'use strict';

angular.module('contentful').factory('PromisedLoader', function ($q, $rootScope, cfSpinner) {

  function PromisedLoader() {
    this.inProgress = false;
  }

  PromisedLoader.IN_PROGRESS = 'Already in progress';

  PromisedLoader.prototype = {

    load: function (params/* host, methodName args ... */) {
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

      function endLoading() {
        loader.inProgress = false;
        delete loader._load;
        stopSpinner();
      }

      if(!loader._load && params.host && params.methodName){
        loader._load = _.throttle(function (host, methodName, args) {
          host[methodName].apply(host, args);
        }, 500);

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
            endLoading();
          });
        });
        loader._load(params.host, params.methodName, args);
      }

      if(!loader._load && params.promiseLoader){
        loader._load = _.throttle(function (promiseLoader, args) {
          params.promiseLoader(args).then(function (res) {
            deferred.resolve(res);
            endLoading();
          }, function (err) {
            deferred.reject(err);
            endLoading();
          });
        }, 500);
        loader._load(params.promiseLoader, args);
      }

      return deferred.promise;
    }

  };

  return PromisedLoader;
});
