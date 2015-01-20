'use strict';

describe('Youtube Player Loader', function() {
  var defer, loader, googleScriptLoader, $q, $window, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector){
      loader             = $injector.get('youtubePlayerLoader');
      googleScriptLoader = $injector.get('googleScriptLoader');
      $window            = $injector.get('$window');
      $rootScope         = $injector.get('$rootScope');
      $q                 = $injector.get('$q');
    });
  });

  it('sets the expected callback function', function(){
    spyOn(googleScriptLoader, 'load').and.callThrough();

    loader.load();

    expect(googleScriptLoader.load.calls.mostRecent().args[1].name).toBe('onYouTubeIframeAPIReady');
  });

  describe('on successful load', function() {
    beforeEach(function() {
      $window.YT = {Player: 'player'};
      defer      = $q.defer();

      spyOn(googleScriptLoader, 'load').and.returnValue(defer.promise);
    });

    it('returns the Youtube Player object', function() {
      var player;

      loader.load().then(function(_player_){ player = _player_; });

      defer.resolve();
      $rootScope.$apply();

      expect(player).toEqual($window.YT.Player);
    });
  });
});
