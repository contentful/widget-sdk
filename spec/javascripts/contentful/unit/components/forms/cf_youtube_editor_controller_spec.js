'use strict';

describe('cfYoutubeEditor Controller', function() {
  var controller, scope, YoutubeUrl;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector, $controller, $rootScope){
      YoutubeUrl = $injector.get('YoutubeUrl');
      scope      = $rootScope.$new();
      scope.otBindInternalChangeHandler = function(){};
      controller = $controller('cfYoutubeEditorController', { $scope : scope });
      scope.$apply();
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('initial state', function() {
    it('has the loading flag set to false', function() {
      expect(scope.isPlayerLoading).toBeFalsy();
    });

    it('has the player ready flag set to false', function() {
      expect(scope.isPlayerReady).toBeFalsy();
    });

    it('has the error message empty', function() {
      expect(scope.errorMessage).toEqual('');
    });
  });

  describe('when the url field changes', function() {
    it('resets the error message', function() {
      scope.errorMessage = 'error';
      expect(scope.errorMessage).toEqual('error');

      scope.url = 'url';
      scope.$apply();

      expect(scope.errorMessage).toEqual('');
    });

    describe('and the url ends up empty', function() {
      it('sets the loading flag to false', function() {
        scope.url = '';
        scope.$apply();
        expect(scope.isPlayerLoading).toBeFalsy();
      });
    });

    describe('and the url ends up with text', function() {
      beforeEach(function() {
        scope.url ='url';
        scope.$apply();
      });

      it('sets the loading flat to true', function() {
        expect(scope.isPlayerLoading).toBeTruthy();
      });

      it('wraps the url in a YoutubeUrl object', function() {
        expect(scope.youtubeUrl).toBeInstanceOf(YoutubeUrl);
      });
    });
  });

  describe('scope callbacks', function() {
    function expectPlayerIsLoadingToBeFalsyAfter(cbName){
      it('sets the loading flag to false', function() {
        scope.isPlayerLoading = true;
        expect(scope.isPlayerLoading).toBeTruthy();

        scope[cbName]();

        expect(scope.isPlayerLoading).toBeFalsy();
      });
    }

    describe('handlePlayerFailure', function() {
      expectPlayerIsLoadingToBeFalsyAfter('handlePlayerFailure');
    });

    describe('handlePlayerReadyToPlayVideo', function() {
      expectPlayerIsLoadingToBeFalsyAfter('handlePlayerReadyToPlayVideo');
    });

    describe('handlePlayerFailedToLoadVideo', function() {
      expectPlayerIsLoadingToBeFalsyAfter('handlePlayerFailedToLoadVideo');
    });

    describe('handlePlayerReady', function() {
      it('set the player ready flag to true', function() {
        scope.isPlayerReady = false;
        expect(scope.isPlayerReady).toBeFalsy();

        scope.handlePlayerReady();

        expect(scope.isPlayerReady).toBeTruthy();
      });
    });
  });
});
