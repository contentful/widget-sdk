'use strict';

angular.module('contentful').factory('PromisedLoader', function ($q, $rootScope, cfSpinner) {

  function PromisedLoader() {
    this.inProgress = false;
  }

  PromisedLoader.IN_PROGRESS = 'Already in progress';

  PromisedLoader.prototype = {

    startLoading: function () {
      this.stopSpinner = cfSpinner.start();
      this.inProgress = true;
    },

    endLoading: function() {
      this.inProgress = false;
      delete this._load;
      this.stopSpinner();
    },

    loadCallback: function (host, methodName/*, args[] */) {
      var deferred = $q.defer();
      var args = _.toArray(arguments).slice(2);
      var loader = this;
      if (loader.inProgress){
        deferred.reject();
        return deferred.promise;
      }

      loader.startLoading();

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
          loader.endLoading();
        });
      });
      loader._load(host, methodName, args);

      return deferred.promise;
    },

    loadPromise: function (promiseLoader/*, args[]*/) {
      var deferred = $q.defer();
      var args = _.toArray(arguments).slice(1);
      var loader = this;
      if (loader.inProgress){
        deferred.reject();
        return deferred.promise;
      }

      loader.startLoading();

      loader._load = _.throttle(function (promiseLoader, args) {
        promiseLoader.apply(null, args).then(function (res) {
          deferred.resolve(res);
          loader.endLoading();
        }, function (err) {
          deferred.reject(err);
          loader.endLoading();
        });
      }, 500);
      loader._load(promiseLoader, args);

      return deferred.promise;
    },



    /**
     * params
     * - host: object which hosts the loading context (used together with methodName)
     * - methodName: callback based loader method to be called on the host (used together with host)
     * - promiseLoader: a promise based loader method
     * - args: arguments to be passed to the loader method
    */
    load: function (params) {
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
          promiseLoader.apply(null, args).then(function (res) {
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
