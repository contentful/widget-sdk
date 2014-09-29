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

  var cache = {};

  function callbackWrapper(callback, defer){
    return function(){
      if(callback) callback();

      defer.resolve();
    };
  }

  return {
    load : function(src, callback){
      var defer;

      if (cache[src]) return cache[src];

      defer                 = $q.defer();
      cache[src]            = defer.promise;
      window[callback.name] = callbackWrapper(callback.fn, defer);

      angularLoad.loadScript(src);

      return cache[src];
    }
  };
}]);

