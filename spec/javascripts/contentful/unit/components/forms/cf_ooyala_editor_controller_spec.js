'use strict';

describe('cfOoyalaEditorController', function () {
  var controller, scope, otChangeValuePDeferred, OoyalaErrorMessages;


  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      $provide.stubDirective('cfOoyalaInput', {});
      $provide.stubDirective('cfOoyalaPlayer', {});
    });

    inject(function ($controller, $injector, $q, $rootScope) {
      OoyalaErrorMessages    = $injector.get('OoyalaErrorMessages');

      otChangeValuePDeferred = $q.defer();

      scope                = $rootScope.$new();
      scope.fieldData      = {value : 1};
      scope.otChangeValueP = jasmine.createSpy().and.returnValue(otChangeValuePDeferred.promise);
      controller           = $controller('cfOoyalaEditorController', {$scope: scope});
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('#addAsset', function() {
    beforeEach(function() {
      scope.selectedVideo = {};
      controller.addAsset({playerId: 1, assetId: 2});
    });

    it('sets the player id of the given asset', function() {
      expect(scope.selectedVideo.playerId).toBe(1);
    });

    it('sets the asset id of the given asset', function() {
      expect(scope.selectedVideo.assetId).toBe(2);
    });

    it('sets the isPlayerReady flag to false', function() {
      expect(scope.isPlayerReady).toBeFalsy();
    });
  });

  describe('#resetErrors', function() {
    beforeEach(function() {
      scope.errorMessage  = 'asda';

      controller.resetErrors();
    });

    it('sets the error message to undefined', function() {
      expect(scope.errorMessage).toBeUndefined();
    });
  });

  describe('#showErrors', function() {
    beforeEach(function() {
      controller.showErrors({message: 'error-1'});
    });

    it('sets the errorMessage to the given error', function() {
      expect(scope.errorMessage).toBe('error-1');
    });
  });

  describe('#resetAsset', function() {
    beforeEach(function() { controller.resetAsset(); });

    it('resets the current asset', function() {
      expect(scope.selectedVideo).toEqual({});
    });
  });

  describe('#resetEditorInput', function() {
    describe('to persist the change in Share JS', function() {
      beforeEach(function() {
        spyOn(controller, 'resetErrors');
        spyOn(controller, 'resetAsset');

        controller.resetEditorInput();
      });

      it('calls otChangeValueP passing undefined', function() {
        expect(scope.otChangeValueP).toHaveBeenCalledWith(undefined);
      });

      describe('on successful save', function() {
        beforeEach(function() {
          otChangeValuePDeferred.resolve();
          scope.$apply();
        });

        it('calls #resetErrors', function() {
          expect(controller.resetErrors).toHaveBeenCalled();
        });

        it('calls #resetAsset', function() {
          expect(controller.resetAsset).toHaveBeenCalled();
        });

        it('sets fieldData.value to undefined', function() {
          expect(scope.fieldData.value).toBeUndefined();
        });
      });

    });
  });

  describe('#persistInput', function() {
    describe('to persist the change in Share JS', function() {
      beforeEach(function() {

        controller.persistInput('input-value');
      });

      it('calls otChangeValueP passing the given input', function() {
        expect(scope.otChangeValueP).toHaveBeenCalledWith('input-value');
      });
    });
  });

  describe('#showFailedToLoadVideoError', function() {
    beforeEach(function(){ controller.showFailedToLoadVideoError(); });

    it('sets the errorMessage the OoyalaErrorMessages.playerFailedToLoad message', function() {
      expect(scope.errorMessage).toBe(OoyalaErrorMessages.playerFailedToLoad);
    });
  });

  describe('#showFailedToPlayVideoError', function() {
    beforeEach(function(){ controller.showFailedToPlayVideoError(); });

    it('sets the errorMessage to OoyalaErrorMessages.playerFailedToPlayVideo', function() {
      expect(scope.errorMessage).toBe(OoyalaErrorMessages.playerFailedToPlayVideo);
    });
  });

  describe('configuration for the search dialog', function() {
    it('passes the current scope', function(){
      expect(scope.searchConfig.scope).toBe(scope);
    });

    it('sets the cf_ooyala_search_dialog as template', function() {
      expect(scope.searchConfig.template).toBe('cf_ooyala_search_dialog');
    });

    describe('onSelection callback', function() {
      beforeEach(function() {
        scope.searchConfig.onSelection([{id: 1}, {id: 2}]);
      });

      it('sets fieldData.value to the first result of the selection ', function() {
        expect(scope.fieldData.value).toBe(1);
      });
    });
  });

});
