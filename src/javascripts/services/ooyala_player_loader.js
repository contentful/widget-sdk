'use strict';
angular.module('contentful').factory('ooyalaPlayerLoader', ['require', function (require){

  var $window     = require('$window');
  var angularLoad = require('angularLoad');
  var $q          = require('$q');

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

  /*
   * We are loading the player only once. No matter the player Id.
   *
   * After browsing the code fetched using the URL above it's clear
   * that the player Id is only used when creating the Flash version
   * (to enable customizations and things like tha) but not for the
   * HTML5 version. Caching it leads to a performance/speed gain
   */
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
