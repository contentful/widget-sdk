'use strict';

angular.module('contentful')
.directive('cfKalturaPlayer', ['require', function (require){
  var kalturaWidgetLoader = require('kalturaWidgetLoader');
  var kalturaCredentials = require('kalturaCredentials');
  var spaceContext = require('spaceContext');
  var $window = require('$window');

  var ID_PREFIX = 'kaltura-player-';

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_kaltura_player'](),
    link: function(scope, elem) {
      var entryId, player, isPlayerEmbedded;
      var organizationId = spaceContext.space.getOrganizationId();

      entryId            = scope.videoWidgetPlayer.attrs.entryId;
      isPlayerEmbedded   = scope.videoWidgetPlayer.attrs.embedded;

      scope.playerDOMId = _.uniqueId(ID_PREFIX);
      scope.play        = play;
      scope.pause       = pause;

      scope.$eval(scope.videoWidgetPlayer.callbacks.onInit);

      kalturaCredentials.get(organizationId).then(function(credentials){
        kalturaWidgetLoader.load(credentials.partner_id, credentials.uiconf_id)
          .then(_.partial(createKalturaPlayer, credentials.partner_id, credentials.uiconf_id));
      });

      function createKalturaPlayer(partner_id, uiconf_id) {
        $window.mw.setConfig('Kaltura.LeadWithHTML5', true);
        $window.kWidget.embed(scope.playerDOMId, {
          targetId: scope.playerDOMId,
          wid: '_' + partner_id,
          uiconf_id: uiconf_id,
          entry_id: entryId,
          readyCallback: notifyPlayerReady
        });
      }

      function notifyPlayerReady(playerId) {
        var $playerIframeDocument;

        player                = elem.find('#' + playerId)[0];
        $playerIframeDocument = $(elem.find('#' + playerId).find('iframe')[0].contentDocument);

        player.kBind('entryFailed', handleEntryFailed);

        if (isPlayerEmbedded){
          /* The 'updateLayout' event is udocumented and I found it
           * using the debug output from kalturas'player.
           *
           * All the other events I tried ('playerReady', 'layoutReady', 'entryReady', ...)
           * weren't useful to get the player in a moment where I could remove the
           * controls bar and tweak other css parameters
           */
          player.kBind('updateLayout', function(){
            $playerIframeDocument.find('.controlsContainer').hide();
            $playerIframeDocument.find('.videoHolder').height('100%');
            $playerIframeDocument.find('.mwEmbedPlayer img').css({height: '100%', width: '100%', left: 0});
            $playerIframeDocument.find('.icon-play').remove();

            /*
             * Other way of playing the video automatically would be to use the
             * 'flashvar: {autoplay: true}' when creating the player with kWidget.embed
             * but doing so would mean having another conditional check there. This way
             * we keep all the logic related to the 'isPlayerEmbedded' in one place.
             */
            play();
          });

          player.kBind('playbackComplete', function(){
            $playerIframeDocument.find('.control-bar').hide();
            scope.$eval(scope.videoWidgetPlayer.callbacks.onPlaybackFinished);
          });

        }

        scope.$apply(function(){
          scope.$eval(scope.videoWidgetPlayer.callbacks.onReady);
        });
      }

      function play() {
        player.sendNotification('doPlay');
      }

      function pause() {
        player.sendNotification('doPause');
      }

      function handleEntryFailed() {
        scope.$eval(scope.videoWidgetPlayer.callbacks.onFailedToLoadVideo);
        $window.kWidget.destroy(scope.playerDOMId);
      }
    }
  };
}]);
