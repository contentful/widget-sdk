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
      var args = _.rest(arguments, 2);
      var loader = this;
      if (loader.inProgress){
        deferred.reject(PromisedLoader.IN_PROGRESS);
        return deferred.promise;
      }

      if(!loader._load) loader._load = _.debounce(function (host, methodName, args) {
        loader.startLoading();
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
      var args = _.rest(arguments, 1);
      var loader = this;
      if (loader.inProgress){
        deferred.reject(PromisedLoader.IN_PROGRESS);
        return deferred.promise;
      }

      if(!loader._load) loader._load = _.debounce(function (promiseLoader, args) {
        loader.startLoading();
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
    }

  };

  return PromisedLoader;
});
