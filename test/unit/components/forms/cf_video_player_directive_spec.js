'use strict';

describe('Video Player Directive', function() {
  var scope, $playerDOMElement;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      var fakeDirective = {
        link: function(scope){
          scope.play  = 'play-fake';
          scope.pause = 'pause-fake';
        }
      };
      $provide.stubDirective('fakeDirective', fakeDirective);
    });

    inject(function($compile, $rootScope) {
      var directive, playerEl;
      scope                       = $rootScope.$new();
      scope.isPlayerEmbedded      = true;
      scope.customAttrs           = {cutomAttr1: 'customAttr-1-value'};
      scope.widgetPlayerDirective = 'fake-directive';

      directive = [
        '<cf-video-player',
        'widget-player-directive="widgetPlayerDirective"',
        'on-init="on-init-callback"',
        'on-ready="on-ready-callback"',
        'on-failed-to-load-video="on-failed-to-load-video-callback"',
        'on-playback-finished=on-playback-finished-callback',
        'embedded="isPlayerEmbedded"',
        'custom-attrs="customAttrs"',
        '/>'
      ].join(' ');

      playerEl          = $compile(directive)(scope);
      $playerDOMElement = playerEl.find('fake-directive');
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('it extends the scope under the "videoWidgetPlayer" property', function() {
    describe('with callbacks object', function() {
      it('has an onInit callback with the value of attrs.onInit', function() {
        expect(scope.videoWidgetPlayer.callbacks.onInit).toEqual('on-init-callback');
      });

      it('has an onReady callback with the value of attrs.onReady', function() {
        expect(scope.videoWidgetPlayer.callbacks.onReady).toEqual('on-ready-callback');
      });

      it('has an onFailedToLoadVideo callback with the value of attrs.onFailedToLoadVideo', function() {
        expect(scope.videoWidgetPlayer.callbacks.onFailedToLoadVideo).toEqual('on-failed-to-load-video-callback');
      });

      it('has an onPlaybackFinished callback with the value of attrs.onPlaybackFinished', function() {
        expect(scope.videoWidgetPlayer.callbacks.onPlaybackFinished).toEqual('on-playback-finished-callback');
      });
    });

    describe('with attrs object', function() {
      it('has a embedded flag with the value or attrs.embedded', function() {
        expect(scope.videoWidgetPlayer.attrs.embedded).toBeTruthy();
      });

      it('has a property for every property inside attrs.customAttrs', function() {
        expect(scope.videoWidgetPlayer.attrs.cutomAttr1).toEqual('customAttr-1-value');
      });
    });
  });

  describe('creates the requested player', function() {
    it('passes the scope containing the videoWidgetPlayer property', function() {
      expect($playerDOMElement.scope().videoWidgetPlayer).not.toBeUndefined();
    });
  });

  describe('extends the videoPlayer scope property', function() {
    it('has a #play callback method with the value of the #play method exposed on the directive scope', function() {
      expect(scope.videoPlayer.play).toBe($playerDOMElement.scope().play);
    });

    it('has a #play callback method with the value of the #play method exposed on the directive scope', function() {
      expect(scope.videoPlayer.pause).toBe($playerDOMElement.scope().pause);
    });
  });
});
