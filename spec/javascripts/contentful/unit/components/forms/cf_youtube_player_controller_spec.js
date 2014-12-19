'use strict';

describe('cfYoutubePlayerController Controller', function() {
  var controller, scope, youtubeGAPIAdapterStub;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      youtubeGAPIAdapterStub = jasmine.createSpyObj('youtubeGAPIAdapterStub', ['videoInfo']);
      $provide.value('youtubeGAPIAdapter', youtubeGAPIAdapterStub);
    });

    inject(function($rootScope, $controller, $q){
      scope = $rootScope.$new();

      youtubeGAPIAdapterStub.videoInfo.and.returnValue($q.defer().promise);
      scope.cueVideoById = jasmine.createSpy();

      controller = $controller('cfYoutubePlayerController', {$scope : scope});
      scope.$apply();
    });
  });

  describe('when the youtubeUrl changes', function() {
    var youtubeUrl, videoId;

    beforeEach(function() {
      controller.startWatchingYoutubeUrl();
    });

    describe('when the youtubeUrl is defined', function() {
      beforeEach(function() {
        videoId    = 1;
        youtubeUrl = jasmine.createSpyObj('youtubeUrlStub', ['videoId']);
        youtubeUrl.videoId.and.returnValue(videoId);

        scope.youtubeUrl = youtubeUrl;
        scope.$apply();
      });

      it('fetches info about the video', function() {
        expect(youtubeGAPIAdapterStub.videoInfo).toHaveBeenCalledWith(videoId);
      });

      it('cues the video', function() {
        expect(scope.cueVideoById).toHaveBeenCalledWith(videoId);
      });
    });
  });
});

