'use strict';

describe('Youtube Player Loader', function() {
  var ytLoader, googleScriptLoader, $window;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector){
      ytLoader           = $injector.get('youtubePlayerLoader');
      googleScriptLoader = $injector.get('googleScriptLoader');
      $window            = $injector.get('$window');
    });
  });

  it('sets the expected callback function', function(){
    var googleLoad = sinon.stub(googleScriptLoader, 'load').resolves();

    ytLoader.load();

    expect(googleLoad.args[0][1].name).toBe('onYouTubeIframeAPIReady');
  });

  pit('returns the Youtube Player object', function() {
    $window.YT = {Player: 'player'};

    sinon.stub(googleScriptLoader, 'load').resolves();

    return ytLoader.load()
    .then(function(player) {
      expect(player).toEqual($window.YT.Player);
    });
  });
});
