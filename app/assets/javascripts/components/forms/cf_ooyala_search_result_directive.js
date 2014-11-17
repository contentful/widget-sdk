'use strict';

angular.module('contentful').directive('cfOoyalaSearchResult', ['$injector', function($injector){

  return {
    restrict: 'C',
    controller: 'cfOoyalaSearchResultController',
    link: function(scope, elem, attr) {
      scope.isResultSelected    = false;
      scope.isMouseOver         = false;
      scope.showLoadingFeedback = false;
      scope.showPreview         = true;

      scope.hideFeedbackInfo = hideFeedbackInfo;
      scope.handleSelection  = handleSelection;
      scope.handlePlay       = handlePlay;
      scope.handleClose      = handleClose;
      scope.handleMouseOver  = handleMouseOver;
      scope.handleMouseOut   = handleMouseOut;

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

      function handlePlay() {
        scope.playerId    = scope.video.playerId;
        scope.assetId     = scope.video.id;
        scope.showPreview = false;
        showFeebackInfo();
        elem.addClass('playing');
      }

      function hideFeedbackInfo() {
        scope.isPlayerLoading = false;
      }

      function showFeebackInfo() {
        scope.isPlayerLoading = true;
      }

      function handleClose() {
        elem.removeClass('playing');
        scope.playerId    = undefined;
        scope.assetId     = undefined;
        scope.showPreview = true;
      }

    }
  };
}]);
