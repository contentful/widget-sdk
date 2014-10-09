'use strict';

angular.module('contentful').directive('cfOoyalaSearchResult', ['$injector', function($injector){

  return {
    restrict: 'C',
    controller: 'cfOoyalaSearchResultController',
    link: function(scope, elem, attr) {
      scope.selected            = false;
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
        if (data.video != scope.video) scope.selected = false;
      }

      function handleMouseOver() {
        elem.addClass('hover');
      }

      function handleMouseOut() {
        elem.removeClass('hover');
      }

      function handleSelection() {
        scope.selected = scope.selected != true;

        if (scope.selected) {
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
