'use strict';

describe('cfYoutubeEditor Controller', function() {
  var controller, deferred, scope, YoutubeUrl;

  beforeEach(function() {
    module('contentful/test');
    inject(function($injector, $controller, $rootScope, $q){
      YoutubeUrl = $injector.get('YoutubeUrl');
      deferred   = $q.defer();

      scope                = $rootScope.$new();
      scope.fieldData      = {};
      scope.otChangeValueP = jasmine.createSpy().and.returnValue(deferred.promise);

      controller           = $controller('cfYoutubeEditorController', { $scope : scope });
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

      scope.fieldData.value = 'url';
      scope.$apply();

      expect(scope.errorMessage).toEqual('');
    });

    describe('and the url ends up empty', function() {
      it('sets the loading flag to false', function() {
        scope.fieldData.value = '';
        scope.$apply();
        expect(scope.isPlayerLoading).toBeFalsy();
      });
    });

    describe('and the url ends up with text', function() {
      beforeEach(function() {
        scope.fieldData.value ='url';
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

    describe('handleClickOnRemoveSign', function() {
      beforeEach(function() {
        scope.handleClickOnRemoveSign();
      });

      describe('uses otChangeValueP to persist the change', function() {
        it('and calls it with undefined', function() {
          expect(scope.otChangeValueP).toHaveBeenCalledWith(undefined);
        });

        describe('on successful save', function() {
          beforeEach(function() {
            deferred.resolve();
            scope.$apply();
          });

          it('sets fieldData.value to undefined', function() {
            expect(scope.fieldData.value).toBeUndefined();
          });

          it('sets youtubeUrl to undefined', function() {
            expect(scope.youtubeUrl).toBeUndefined();
          });
        });
      });
    });

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
