'use strict';
angular.module('contentful').factory('ooyalaPlayerLoader', ['$injector', function($injector){

  var $window     = $injector.get('$window');
  var angularLoad = $injector.get('angularLoad');
  var $q          = $injector.get('$q');

  /*
   * Force the load of the HTML5 player.
   *
   * By default ooyala will try to load the Flash player which is easier to setup (no css involved)
   * but has a great drawback: if the user changes tab in the user interface the player is reseted
   * and left in a 'zombie' state. On this state there are no controls and the only thing shown
   * is a spinner which never stops spinning : (
   */
  var SCRIPT_BASE_SRC = '//player.ooyala.com/v3/:player_id?platform=priority-html5';
  var defer           = $q.defer();
  var promise;

  return {
    load : function(playerId){
      if (!promise) {
          angularLoad.loadScript(SCRIPT_BASE_SRC.replace(':player_id', playerId)).then(handlePlayerLoad, handleLoadError);
          promise = defer.promise;
        }

      return promise;
    }
  };

  function handlePlayerLoad() {
    $window.OO.ready(function(){ defer.resolve($window.OO); });
  }

  function handleLoadError() {
    defer.reject();
  }
}]);
