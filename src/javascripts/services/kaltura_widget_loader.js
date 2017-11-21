'use strict';

angular.module('contentful').factory('kalturaWidgetLoader', ['require', function (require){

  var $window     = require('$window');
  var angularLoad = require('angularLoad');
  var $q          = require('$q');

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
