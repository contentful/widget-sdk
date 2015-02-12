'use strict';

describe('Video Player Controller', function() {
  var scope, videoPlayerController;
  beforeEach(function() {
    module('contentful/test');
    inject(function($controller, $rootScope){
      scope                 = $rootScope.$new();
      scope.videoPlayer     = jasmine.createSpyObj('videoPlayerMock', ['play', 'pause']);
      videoPlayerController = $controller('cfVideoPlayerController', {$scope : scope});
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('#play', function() {
    beforeEach(function() {
      videoPlayerController.play();
    });

    it('calls the #play method on the videoPlayer object on the scope ', function() {
      expect(scope.videoPlayer.play).toHaveBeenCalled();
    });
  });

  describe('#pause', function() {
    beforeEach(function() {
      videoPlayerController.pause();
    });

    it('class the #pause method on the videoPlayer object on the scope', function() {
      expect(scope.videoPlayer.pause).toHaveBeenCalled();
    });
  });
});
