'use strict';

angular.module('contentful').factory('kalturaWidgetLoader', ['$injector', function($injector){

  var $window     = $injector.get('$window');
  var angularLoad = $injector.get('angularLoad');
  var $q          = $injector.get('$q');

  var SCRIPT_BASE_SRC = 'https://www.kaltura.com/p/:partnerId/sp/:partnerId00/embedIframeJs/uiconf_id/:uiConfId/partner_id/:partnerId';
  var defer           = $q.defer();
  var promise;

  return {
    load : function(partnerId, uiconfId){

      if (!promise) {
          angularLoad.loadScript(SCRIPT_BASE_SRC.replace(/:partnerId/g, partnerId).replace(/:uiConfId/g, uiconfId))
            .then(handlePlayerLoad, handleLoadError);
          promise = defer.promise;
        }

      return promise;
    }
  };

  function handlePlayerLoad() {
    defer.resolve($window.kWidget);
  }

  function handleLoadError() {
    defer.reject();
  }
}]);
