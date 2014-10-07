'use strict';

angular.module('contentful').factory('PromisedLoader', ['$q', '$rootScope', 'cfSpinner', 'debounce', function ($q, $rootScope, cfSpinner, debounce) {

  function PromisedLoader() {
    this.inProgress = false;
    this._loadPromise = debounce(this._loadPromiseImmediately, 500, {leading: true});
  }

  PromisedLoader.IN_PROGRESS = 'Already in progress';

  PromisedLoader.prototype = {

    startLoading: function () {
      this.stopSpinner = cfSpinner.start();
      this.inProgress = true;
    },

    endLoading: function() {
      this.inProgress = false;
      this.stopSpinner();
    },

    _loadPromiseImmediately: function (promiseLoader, args, deferred) {
      var loader = this;
      this.startLoading();
      promiseLoader.apply(null, args).then(function (res) {
        deferred.resolve(res);
        loader.endLoading();
      }, function (err) {
        deferred.reject(err);
        loader.endLoading();
      });
    },

    _loadPromise: null, // Initialized in Constructor

    loadPromise: function (promiseLoader/*, args[]*/) {
      var deferred = $q.defer();
      var args = _.rest(arguments, 1);
      if (this.inProgress){
        deferred.reject(PromisedLoader.IN_PROGRESS);
        return deferred.promise;
      }

      this._loadPromise(promiseLoader, args, deferred);

      return deferred.promise;
    }

  };

  return PromisedLoader;
}]);
