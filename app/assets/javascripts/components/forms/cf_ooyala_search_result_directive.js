'use strict';

angular.module('contentful').directive('cfOoyalaSearchResult', ['$injector', function($injector){

  return {
    restrict: 'C',
    controller: 'cfOoyalaSearchResultController',
    controllerAs: 'ooyalaSearchResultController',
    link: function(scope, elem, attr) {
      scope.isResultSelected    = false;
      scope.isMouseOver         = false;
      scope.showPreview         = true;

      scope.handleSelection  = handleSelection;
      scope.handleMouseOver  = handleMouseOver;
      scope.handleMouseOut   = handleMouseOut;
      scope.ooyalaPlayerController = ooyalaPlayerController;

      scope.$on('video:selected', deselectCurrentVideo);

      function deselectCurrentVideo(e, data) {
        if (data.video != scope.video) scope.isResultSelected = false;
      }

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

      function handleSelection() {
        scope.isResultSelected = scope.isResultSelected != true;

        if (scope.isResultSelected) {
          scope.selectVideo(scope.video);
        } else {
          scope.deselectVideo(scope.video);
        }
      }

      function ooyalaPlayerController() {
        return elem.find('cf-ooyala-player').scope().ooyalaPlayerController;
      }

    }
  };
}]);
