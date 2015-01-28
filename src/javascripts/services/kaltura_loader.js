'use strict';

angular.module('contentful').factory('kalturaLoader', ['$injector', function($injector){

  var angularLoad = $injector.get('angularLoad');
  var $q          = $injector.get('$q');

  var SCRIPT_SRC = '/app/kaltura.js';
  var defer      = $q.defer();
  var promise;

  return {
    load : function(){

      if (!promise) {
          angularLoad.loadScript(SCRIPT_SRC).then(handlePlayerLoad, handleLoadError);
          promise = defer.promise;
        }

      return promise;
    }
  };

  function handlePlayerLoad() {
    defer.resolve();
  }

  function handleLoadError() {
    defer.reject();
  }
}]);


