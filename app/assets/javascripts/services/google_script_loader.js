'use strict';

/*
 *
 * This service provides a simpler interface to loading javascript libraries
 * created by google.
 *
 * The google libraries used in this project (YoutubePlayer and GApi so far) expect
 * a global callback that will be called once the libraries have been loaded and
 * initialized. This service makes dealing with this easier.
 */

angular.module('contentful').factory('googleScriptLoader', ['$injector', function($injector){

  var $q          = $injector.get('$q');
  var angularLoad = $injector.get('angularLoad');
  var $window     = $injector.get('$window');
  var $rootScope  = $injector.get('$rootScope');

  var cache = {};

  function removeCallback(callback) {
    delete $window[callback.name];
  }

  function callbackWrapper(callback, defer){
    return function(){
      _.result(callback, callback.fn);

      removeCallback(callback);
      $rootScope.$apply(function(){
        defer.resolve();
      });
    };
  }

  function handleLoadErrorWrapper(callback, defer) {
    return function(){
      removeCallback(callback);
      $rootScope.$apply(function(){
        defer.reject();
      });
    };
  }

  return {
    load : function(src, callback){
      var defer;

      if (!cache[src]){
        defer                  = $q.defer();
        cache[src]             = defer.promise;
        $window[callback.name] = callbackWrapper(callback, defer);

        angularLoad.loadScript(src).then(angular.noop, handleLoadErrorWrapper);
      }

      return cache[src];
    }
  };
}]);

