'use strict';

angular.module('contentful').directive('cfVideoPlayer', ['$compile', function($compile){

  return {
    restrict   : 'E',
    template   : JST['cf_video_player'](),
    controller : 'cfVideoPlayerController',
    link: function(scope, elem, attrs) {
      var directive;

      scope.videoWidgetPlayer = {
        callbacks: {
          onInit: attrs.onInit,
          onReady: attrs.onReady,
          onPlaybackFinished : attrs.onPlaybackFinished,
          onFailedToLoadVideo: attrs.onFailedToLoadVideo
        },
        attrs: _.extend({
          embedded: scope.$eval(attrs.embedded)
        },
        scope.$eval(attrs.customAttrs, scope))
      };

      directive  = $compile('<' + scope.$eval(attrs.widgetPlayerDirective) + '/>')(scope);

      scope.videoPlayer = {
        play  : directive.scope().play,
        pause : directive.scope().pause
      };

      elem.append(directive);
    }
  };
}]);


