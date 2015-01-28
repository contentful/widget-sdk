'use strict';

describe('Video Editor Controller', function() {
  var attrs, scope, videoEditorController;

  beforeEach(function() {
    module('contentful/test');

    inject(function ($controller, $injector, $q, $rootScope) {
      var providerVideoControllerCallbackNames = [
        'prepareSearch',
        'processSearchResults',
        'customAttrsForPlayerInSearchDialog',
        'processLookupInProviderResult',
        'customAttrsForPlayer',
        'loadingFeedbackMessage',
        'lookupVideoInProvider',
        'shouldRenderVideoPlayer',
        'isWidgetReady'];

      scope                               = $rootScope.$new();
      scope.fieldData                     = {};
      scope.providerVideoEditorController = jasmine.createSpyObj('providerVideoEditorControllerMock', providerVideoControllerCallbackNames);

      attrs = {widgetPlayerDirective: 'cf-widget-directive'};

      videoEditorController = $controller('cfVideoEditorController', {$scope: scope, $attrs: attrs});
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('videoEditor scope properties', function() {
    describe('search config', function() {
      it('sets the "widgetPlayerDirective" property to the value of the "$attrs.widgetPlayerDirective"', function() {
        expect(scope.videoEditor.searchConfig.widgetPlayerDirective).toEqual(attrs.widgetPlayerDirective);
      });

      it('sets the #prepareSearch callback method to the #prepareSearch method on the provider editor controller', function() {
        expect(scope.videoEditor.searchConfig.prepareSearch).toEqual(scope.providerVideoEditorController.prepareSearch);
      });

      it('sets the #processSearchResults callback method to the #processSearchResults method on the provider editor controller', function() {
        expect(scope.videoEditor.searchConfig.processSearchResults).toEqual(scope.providerVideoEditorController.processSearchResults);
      });

      it('sets the #customAttrsForPlayer callback method to the #customAttrsForPlayerInSearchDialog method on the provider editor controller', function() {
        expect(scope.videoEditor.searchConfig.customAttrsForPlayer).toEqual(scope.providerVideoEditorController.customAttrsForPlayerInSearchDialog);
      });

      describe('#onSelection callback method', function() {
        describe('when there is no selected video', function() {
          var oldFieldDataValue;
          beforeEach(function() {
            scope.fieldData.value = 'value';
            oldFieldDataValue     = scope.fieldData.value;
            scope.videoEditor.searchConfig.onSelection([]);
          });

          it('it does not modify the fieldData value', function() {
            expect(scope.fieldData.value).toEqual(oldFieldDataValue);
          });
        });

        describe('when there is a selection', function() {
          beforeEach(function() {
            scope.videoEditor.searchConfig.onSelection([{id: 'selection-id'}]);
          });
          it('sets the fieldData.value property to the id of the first element in the selection array', function() {
            expect(scope.fieldData.value).toEqual('selection-id');
          });
        });
      });
    });

    it('sets the "widgetPlayerDirective" property to the value of the "$attrs.widgetPlayerDirective"', function() {
      expect(scope.videoEditor.widgetPlayerDirective).toEqual(attrs.widgetPlayerDirective);
    });
  });

  describe('#addAsset', function() {
    beforeEach(function() {
      scope.providerVideoEditorController.processLookupInProviderResult.and.returnValue('processed-video-id');
      videoEditorController.addAsset('asset-id');
    });

    it('calls the #processLookupInProviderResult callback method on the provider editor controller', function(){
      expect(scope.providerVideoEditorController.processLookupInProviderResult).toHaveBeenCalledWith('asset-id');
    });

    it('sets the "videoEditor.selectedAsset" to the returned value from the callback', function() {
      expect(scope.videoEditor.selectedAsset).toEqual('processed-video-id');
    });
  });

  describe('#customAttrsForPlayer', function() {
    var customAttrs;
    beforeEach(function() {
      scope.providerVideoEditorController.customAttrsForPlayer.and.returnValue('attrs');
      scope.videoEditor.selectedAsset = 'asset';
      customAttrs                     = videoEditorController.customAttrsForPlayer();
    });

    it('calls the #customAttrsForPlayer callback method on the provider editor controller', function() {
      expect(scope.providerVideoEditorController.customAttrsForPlayer).toHaveBeenCalledWith('asset');
    });

    it('returns the value returned from the callback', function() {
      expect(customAttrs).toEqual('attrs');
    });
  });

  describe('#isVideoWidgetReady', function() {
    var isReady;
    beforeEach(function() {
      scope.providerVideoEditorController.isWidgetReady.and.returnValue(true);
      isReady = videoEditorController.isVideoWidgetReady();
    });

    it('calls the #isWidgetReady callback method on the provider editor controller', function() {
      expect(scope.providerVideoEditorController.isWidgetReady).toHaveBeenCalled();
    });

    it('returns the value returned from the callback', function() {
      expect(isReady).toBeTruthy();
    });
  });

  describe('#loadingPlayerFeedbackMessage', function() {
    var message;
    beforeEach(function() {
      scope.providerVideoEditorController.loadingFeedbackMessage.and.returnValue('message');
      scope.videoEditor.selectedAsset = 'asset';
      message                         = videoEditorController.loadingPlayerFeedbackMessage();
    });

    it('calls the #loadingFeedbackMessage callback method on the provider editor controller', function() {
      expect(scope.providerVideoEditorController.loadingFeedbackMessage).toHaveBeenCalledWith('asset');
    });

    it('returns the value returned from the callback', function() {
      expect(message).toEqual('message');
    });
  });

  describe('#lookupAsset', function() {
    var asset;
    beforeEach(function() {
      scope.providerVideoEditorController.lookupVideoInProvider.and.returnValue('asset');
      asset = videoEditorController.lookupAsset('asset-1');
    });

    it('calls the #lookupVideoInProvider callback method on the provider editor controller', function() {
      expect(scope.providerVideoEditorController.lookupVideoInProvider).toHaveBeenCalledWith('asset-1');
    });

    it('returns the value returned from the callback', function() {
      expect(asset).toEqual('asset');
    });
  });

  describe('#resetAsset', function() {
    beforeEach(function() {
      videoEditorController.resetAsset();
    });

    it('sets the selected asset to an empty object', function() {
      expect(scope.videoEditor.selectedAsset).toEqual({});
    });
  });

  describe('#resetErrors', function() {
    beforeEach(function() {
      videoEditorController.resetErrors();
    });

    it('sets the error message to undefined', function() {
      expect(scope.videoEditor.errorMessage).toBeUndefined();
    });
  });

  describe('#setPlayerIsLoading', function() {
    beforeEach(function() {
      videoEditorController.setPlayerIsLoading();
    });

    it('sets the isPlayerLoading flag to true', function() {
      expect(scope.videoEditor.isPlayerLoading).toBeTruthy();
    });
  });

  describe('#setPlayerIsNotLoading', function() {
    beforeEach(function() {
      videoEditorController.setPlayerIsNotLoading();
    });

    it('sets the isPlayerReady flag to false', function() {
      expect(scope.videoEditor.isPlayerLoading).toBeFalsy();
    });
  });

  describe('#setPlayerNotReady', function() {
    beforeEach(function() {
      videoEditorController.setPlayerNotReady();
    });

    it('sets the isPlayerReady flag to false', function() {
      expect(scope.videoEditor.isPlayerReady).toBeFalsy();
    });
  });

  describe('#setPayerReady', function() {
    beforeEach(function() {
      videoEditorController.setPlayerReady();
    });

    it('sets the isPlayerReady flag to true', function() {
      expect(scope.videoEditor.isPlayerReady).toBeTruthy();
    });
  });

  describe('#showErrors', function() {
    beforeEach(function() {
      videoEditorController.showErrors({ message: 'error message' });
    });

    it('sets the errorMessage property to message property of the given error', function() {
      expect(scope.videoEditor.errorMessage).toEqual('error message');
    });
  });

  describe('#shouldShowPlayerLoadingFeedback', function() {
    describe('when the player is loading and the player is not ready and there is no error', function() {
      var shouldShowFeedback;
      beforeEach(function() {
        scope.videoEditor.isPlayerLoading = true;
        scope.videoEditor.isPlayerReady   = false;
        scope.videoEditor.errorMessage    = undefined;

        shouldShowFeedback = videoEditorController.shouldShowPlayerLoadingFeedback();
      });

      it('should return true', function() {
        expect(shouldShowFeedback).toBeTruthy();
      });
    });
  });

  describe('#shouldRenderVideoPlayer', function() {
    var shouldRenderPlayer;
    beforeEach(function() {
      scope.providerVideoEditorController.shouldRenderVideoPlayer.and.returnValue('returned value');
      scope.videoEditor.selectedAsset = 'asset-1';
      shouldRenderPlayer              = videoEditorController.shouldRenderVideoPlayer();
    });

    it('calls the #shouldRenderVideoPlayer callback method on the provider editor controller', function() {
      expect(scope.providerVideoEditorController.shouldRenderVideoPlayer).toHaveBeenCalledWith('asset-1');
    });

    it('returns the returned value from the callback', function() {
      expect(shouldRenderPlayer).toEqual('returned value');
    });
  });

});
