'use strict';

angular.module('contentful').factory('googleMapsLoader', ['$injector', function ($injector) {
  var $window            = $injector.get('$window'),
      googleScriptLoader = $injector.get('googleScriptLoader'),
      // TODO: Move the API key elsewhere instead of hardcoding it here
      SCRIPT_SRC = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDskFlzw1ujRovNWNG3K64EUsncYTbRPfM&callback=onGoogleMapsAPIReady';

  return {
    load: function () {
      return googleScriptLoader.load(SCRIPT_SRC, { name: 'onGoogleMapsAPIReady' })
      .then(function () {
        return $window.google.maps;
      });
    }
  };
}]);

