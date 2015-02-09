'use strict';

describe('Video Search Result Controller', function() {
  var controller, scope;

  beforeEach(function() {
    module('contentful/test');

    inject(function($controller, $rootScope){
      var videoPlayerControllerMock, videoSearchControllerMock;

      videoPlayerControllerMock = jasmine.createSpyObj('videoPlayerControllerMock', ['pause', 'play']);
      videoSearchControllerMock = jasmine.createSpyObj('videoSearchControllerMock',
                                                       ['pauseCurrentPlayer', 'deselectVideo', 'selectVideo']);

      scope       = $rootScope.$new();
      scope.video = 'video-1';
      scope.videoPlayerController = sinon.stub().returns(videoPlayerControllerMock);
      scope.videoSearchController = videoSearchControllerMock;

      controller  = $controller('cfVideoSearchResultController', {$scope: scope});
    });
  });

  describe('when the "video:selected" event is triggered', function() {
    describe('when the selected video is different to the one in scope', function() {
      beforeEach(function() {
        scope.$emit('video:selected', {video: 'other-video'});
      });

      it('sets the isResultSelected scope property to false', function() {
        expect(scope.videoSearchResult.isResultSelected).toBeFalsy();
      });
    });
  });

  describe('#pauseVideo', function() {
    beforeEach(function() {
      controller.pauseVideo();
    });

    it('sets the isPlaying scope property to false', function() {
      expect(scope.videoSearchResult.isPlaying).toBeFalsy();
    });

    it('calls the #pause method on the videoPlayerController', function() {
      expect(scope.videoPlayerController().pause).toHaveBeenCalled();
    });
  });

  describe('#playVideo', function() {
    beforeEach(function() {
      controller.playVideo();
    });

    describe('when the player is not enabled', function() {
      beforeEach(function() {
        scope.videoSearchResult.isPlayerEnabled = false;
        controller.playVideo();
      });

      it('sets the isPlayerEnabled scope property to true', function() {
        expect(scope.videoSearchResult.isPlayerEnabled).toBeTruthy();
      });

      it('sets the isPlayerLoading scope property to true', function() {
        expect(scope.videoSearchResult.isPlayerLoading).toBeTruthy();
      });

      it('does not call the #play method on the videoPlayerController', function() {
        expect(scope.videoPlayerController().play).not.toHaveBeenCalled();
      });
    });

    describe('when the player is enabled', function() {
      beforeEach(function() {
        scope.videoSearchResult.isPlayerEnabled = true;
        controller.playVideo();
      });

      it('calls the #play method on the videoPlayerController', function() {
        expect(scope.videoPlayerController().play).toHaveBeenCalled();
      });
    });

    it('calls the #pauseCurrentPlayer method on the videoSearchController', function() {
      expect(scope.videoSearchController.pauseCurrentPlayer).toHaveBeenCalledWith(controller);
    });

    it('sets the showPreview scope property to false', function() {
      expect(scope.videoSearchResult.showPreview).toBeFalsy();
    });

    it('sets the isPlaying scope property to true', function() {
      expect(scope.videoSearchResult.isPlaying).toBeTruthy();
    });
  });

  describe('#selectVideo', function() {
    describe('when the result is already selected', function() {
      beforeEach(function() {
        scope.videoSearchResult.isResultSelected = true;
        controller.selectVideo();
      });

      it('sets the isResultSelected scope property to false', function() {
        expect(scope.videoSearchResult.isResultSelected).toBeFalsy();
      });

      it('calls the #deselectVideo method on the videoSearchController', function() {
        expect(scope.videoSearchController.deselectVideo).toHaveBeenCalledWith(scope.video);
      });
    });

    describe('when the result is not selected', function() {
      beforeEach(function() {
        scope.videoSearchResult.isResultSelected = false;
        controller.selectVideo();
      });

      it('sets the isResultSelected scope property to true', function() {
        expect(scope.videoSearchResult.isResultSelected).toBeTruthy();
      });

      it('calls the #selectVideo method on the videoSearchController', function() {
        expect(scope.videoSearchController.selectVideo).toHaveBeenCalledWith(scope.video);
      });
    });
  });

  describe('setVideoNotPlaying', function() {
    beforeEach(function() {
      controller.setVideoNotPlaying();
    });

    it('sets the isPlaying scope property to false', function() {
      expect(scope.videoSearchResult.isPlaying).toBeFalsy();
    });
  });

  describe('#handlePlayerReady', function() {
    beforeEach(function() {
      controller.handlePlayerReady();
    });

    it('sets the isPlayerLoading scope property to false', function() {
      expect(scope.videoSearchResult.isPlayerLoading).toBeFalsy();
    });

    it('sets the showPlayer scope property to true', function() {
      expect(scope.videoSearchResult.showPlayer).toBeTruthy();
    });
  });
});
