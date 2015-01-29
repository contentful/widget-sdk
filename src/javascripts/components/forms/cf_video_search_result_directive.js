'use strict';

angular.module('contentful').directive('cfVideoSearchResult', [function(){
  return {
    restrict: 'C',
    controller: 'cfVideoSearchResultController',
    controllerAs: 'videoSearchResultController',
    link: function(scope, elem) {
      scope.isMouseOver         = false;

      scope.handleMouseOver       = handleMouseOver;
      scope.handleMouseOut        = handleMouseOut;
      scope.videoPlayerController = videoPlayerController;


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

      function videoPlayerController() {
        return elem.find('.video-player').controller('cfVideoPlayer');
      }
    }
  };
}]);
