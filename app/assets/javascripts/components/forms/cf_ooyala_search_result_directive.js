'use strict';

angular.module('contentful').directive('cfOoyalaSearchResult', [function(){

  return {
    restrict: 'C',
    controller: 'cfOoyalaSearchResultController',
    controllerAs: 'ooyalaSearchResultController',
    link: function(scope, elem, attr) {
      scope.isMouseOver         = false;

      scope.handleMouseOver  = handleMouseOver;
      scope.handleMouseOut   = handleMouseOut;
      scope.ooyalaPlayerController = ooyalaPlayerController;


      function handleMouseOver(e) {
        scope.isMouseOver = isCursorOverResult(e);
      }

      function handleMouseOut(e) {
        scope.isMouseOver = isCursorOverResult(e);
      }

      function isCursorOverResult(event) {
        var elUnderCursor = document.elementFromPoint(event.clientX, event.clientY);

        return elem[0].contains(elUnderCursor);
      }

      function ooyalaPlayerController() {
        return elem.find('cf-ooyala-player').scope().ooyalaPlayerController;
      }

    }
  };
}]);
