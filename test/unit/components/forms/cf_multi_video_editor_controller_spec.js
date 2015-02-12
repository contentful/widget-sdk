'use strict';

describe('Multi Video Editor Controller', function() {
  var attrs, scope, multiVideoEditorController, ShareJSMock,
      callbackWithApplyDeferred, $rootScope;

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      ShareJSMock = jasmine.createSpyObj('ShareJSMock', ['peek', 'mkpath']);
      $provide.value('ShareJS', ShareJSMock);
    });

    inject(function ($controller, $injector, $q) {
      var providerVideoControllerCallbackNames = [
        'prepareSearch',
        'processSearchResults',
        'customAttrsForPlayerInSearchDialog',
        'customAttrsForPlayer',
        'isWidgetReady',
        'lookupVideoInProvider'];

      var callbackWithApplyStub = sinon.stub();

      $rootScope = $injector.get('$rootScope');

      callbackWithApplyDeferred     = $q.defer();
      callbackWithApplyStub.promise = callbackWithApplyDeferred.promise;
      $q.callbackWithApply          = sinon.stub().returns(callbackWithApplyStub);

      scope                               = $rootScope.$new();
      scope.fieldData                     = {};
      scope.providerVideoEditorController = jasmine.createSpyObj('providerVideoEditorControllerMock', providerVideoControllerCallbackNames);

      attrs = {};

      multiVideoEditorController = $controller('cfMultiVideoEditorController', {$scope: scope, $attrs: attrs});
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('multiVideoEditor scope properties', function() {
    describe('search config', function() {
      it('sets the "widgetPlayerDirective" property to the value of the "$attrs.widgetPlayerDirective"', function() {
        expect(scope.multiVideoEditor.searchConfig.widgetPlayerDirective).toEqual(attrs.widgetPlayerDirective);
      });

      it('sets the #prepareSearch callback method to the #prepareSearch method on the provider editor controller', function() {
        expect(scope.multiVideoEditor.searchConfig.prepareSearch).toEqual(scope.providerVideoEditorController.prepareSearch);
      });

      it('sets the #processSearchResults callback method to the #processSearchResults method on the provider editor controller', function() {
        expect(scope.multiVideoEditor.searchConfig.processSearchResults).toEqual(scope.providerVideoEditorController.processSearchResults);
      });

      it('sets the #customAttrsForPlayer callback method to the #customAttrsForPlayerInSearchDialog method on the provider editor controller', function() {
        expect(scope.multiVideoEditor.searchConfig.customAttrsForPlayer).toEqual(scope.providerVideoEditorController.customAttrsForPlayerInSearchDialog);
      });

      describe('#onSelection callback method', function() {
        var asset1, asset2;
        beforeEach(function() {
          asset1 = {id: 'other-selection'};
          asset2 = {id: 'selection-id'};

          spyOn(multiVideoEditorController, 'storeAsset');
          scope.multiVideoEditor.searchConfig.onSelection([asset1, asset2]);
        });

        it('calls the #storeAsset method with each one of the selected assets', function() {
          expect(multiVideoEditorController.storeAsset.calls.count()).toEqual(2);
          expect(multiVideoEditorController.storeAsset.calls.argsFor(0)).toEqual([{assetId: 'other-selection'}]);
          expect(multiVideoEditorController.storeAsset.calls.argsFor(1)).toEqual([{assetId: 'selection-id'}]);
        });
      });
    });

    it('sets the "widgetPlayerDirective" property to the value of the "$attrs.widgetPlayerDirective"', function() {
      expect(scope.multiVideoEditor.widgetPlayerDirective).toEqual(attrs.widgetPlayerDirective);
    });
  });

  describe('#customAttrsForPlayer', function() {
    var customAttrs;
    beforeEach(function() {
      scope.providerVideoEditorController.customAttrsForPlayer.and.returnValue('attrs');
      customAttrs = multiVideoEditorController.customAttrsForPlayer('asset');
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
      isReady = multiVideoEditorController.isVideoWidgetReady();
    });

    it('calls the #isWidgetReady callback method on the provider editor controller', function() {
      expect(scope.providerVideoEditorController.isWidgetReady).toHaveBeenCalled();
    });

    it('returns the value returned from the callback', function() {
      expect(isReady).toBeTruthy();
    });
  });

  describe('#storeAsset', function() {
    var insertOpMock;
    beforeEach(function() {
      insertOpMock = jasmine.createSpyObj('insertOpMock', ['insert']);
      scope.otDoc  = jasmine.createSpyObj('otDocMock', ['at']);
      scope.otDoc.at.and.returnValue(insertOpMock);

      scope.otPathTypes = 'ot-path-types';
      scope.otPath      = 'ot-path';
    });

    describe('when there are already items in the document', function() {
      beforeEach(function() {
        ShareJSMock.peek.and.returnValue([]);
        multiVideoEditorController.storeAsset({assetId: 'asset-id'});
      });

      it('finds the path in the document', function() {
        expect(scope.otDoc.at).toHaveBeenCalledWith(scope.otPath);
      });

      it('prepends the new asset', function() {
        expect(insertOpMock.insert).toHaveBeenCalledWith(0, 'asset-id', jasmine.any(Function));
      });
    });

    describe('when there are no items in the document', function() {
      beforeEach(function() {
        ShareJSMock.peek.and.returnValue(undefined);
        multiVideoEditorController.storeAsset({assetId: 'asset-id'});
      });

      it('creates a path in the document', function() {
        expect(ShareJSMock.mkpath).toHaveBeenCalledWith({
          doc: scope.otDoc,
          path: scope.otPath,
          types: scope.otPathTypes,
          value: ['asset-id']
        }, jasmine.any(Function));
      });
    });

    describe('when the asset is successfully saved', function() {
      var asset;
      beforeEach(function() {
        scope.videoInputController = sinon.stub().returns(jasmine.createSpyObj('', ['clearField']));
        scope.multiVideoEditor.assets = ['other-asset'];

        asset = {assetId: 'asset-id'};
        multiVideoEditorController.storeAsset(asset);
        callbackWithApplyDeferred.resolve();

        $rootScope.$apply();
      });

      it('the new assed is prepended to the list of assets', function() {
        expect(scope.multiVideoEditor.assets[0].assetId).toEqual('asset-id');
      });

      it('clears the input field', function() {
        expect(scope.videoInputController().clearField).toHaveBeenCalled();
      });
    });
  });

  describe('#lookupAsset', function() {
    var asset;
    beforeEach(function() {
      scope.providerVideoEditorController.lookupVideoInProvider.and.returnValue('asset');
      asset = multiVideoEditorController.lookupAsset('asset-1');
    });

    it('calls the #lookupVideoInProvider callback method on the provider editor controller', function() {
      expect(scope.providerVideoEditorController.lookupVideoInProvider).toHaveBeenCalledWith('asset-1');
    });

    it('returns the value returned from the callback', function() {
      expect(asset).toEqual('asset');
    });
  });

  describe('#resetErrors', function() {
    beforeEach(function() {
      multiVideoEditorController.resetErrors();
    });

    it('sets the error to undefined', function() {
      expect(scope.multiVideoEditor.error).toBeUndefined();
    });
  });

  describe('#showErrors', function() {
    beforeEach(function() {
      multiVideoEditorController.showErrors({ message: 'error message' });
    });

    it('sets the errorMessage property to message property of the given error', function() {
      expect(scope.multiVideoEditor.error).toEqual('error message');
    });
  });
});
