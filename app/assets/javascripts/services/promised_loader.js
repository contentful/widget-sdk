'use strict';

angular.module('contentful').factory('PromisedLoader', function ($q, $rootScope, cfSpinner, debounce) {

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
      this.stopSpinner();
    },

    _loadCallback: debounce(function (host, methodName, args) {
      this.startLoading();
      host[methodName].apply(host, args);
    }, 500, {leading: true, trailing: false}),

    loadCallback: function (host, methodName/*, args[] */) {
      var deferred = $q.defer();
      var args = _.rest(arguments, 2);
      var loader = this;
      if (loader.inProgress){
        deferred.reject(PromisedLoader.IN_PROGRESS);
        return deferred.promise;
      }

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
      loader._loadCallback(host, methodName, args);

      return deferred.promise;
    },

    // Variant that delegates to loadPromise
    //loadCallback: function (host, methodName) {
      //var args = _.rest(arguments, 2);
      //return this.loadPromise(function (args) {
        //var cb = $q.callback();
        //args.push(cb);
        //host[methodName].apply(host, args);
        //return cb.promise.then(function (res, stats) {
          //if (_.isObject(stats)) _.each(stats, function (stat, name) {
            //Object.defineProperty(res, name, {value: stat});
          //});
        //});
      //}, args);
    //},

    _loadPromise: debounce(function (promiseLoader, args, deferred) {
      var loader = this;
      this.startLoading();
      promiseLoader.apply(null, args).then(function (res) {
        deferred.resolve(res);
        loader.endLoading();
      }, function (err) {
        deferred.reject(err);
        loader.endLoading();
      });
    }, 500, {leading: true, trailing: false}),

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
});
