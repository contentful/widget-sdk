'use strict';

describe('Multi Video Editor Controller', function() {
  var scope, multiVideoEditorController, ShareJSMock,
      callbackWithApplyDeferred, $rootScope;

  afterEach(function () {
    scope = multiVideoEditorController = ShareJSMock =
      callbackWithApplyDeferred = $rootScope = null;
  });

  beforeEach(function() {
    module('contentful/test');
    module(function($provide){
      ShareJSMock = {};
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
      scope.providerVideoEditorController.widgetPlayerDirective = 'cf-widget-player-directive';

      multiVideoEditorController = $controller('cfMultiVideoEditorController', {$scope: scope});
    });
  });

  afterEach(inject(function($log){
    $log.assertEmpty();
  }));

  describe('multiVideoEditor scope properties', function() {
    describe('#onSelection search config method', function() {
      beforeEach(function() {
        this.fieldApi.insertValue = sinon.stub().resolves();
      });

      it('inserts each selected asset', function() {
        var selection = [{id: 'A'}, {id: 'B'}];
        scope.multiVideoEditor.searchConfig.onSelection(selection);
        sinon.assert.callCount(this.fieldApi.insertValue, 2);
        sinon.assert.calledWithExactly(this.fieldApi.insertValue, 0, 'A');
        sinon.assert.calledWithExactly(this.fieldApi.insertValue, 0, 'B');
      });
    });

    it('sets the "widgetPlayerDirective" property to the value of the "$attrs.widgetPlayerDirective"', function() {
      expect(scope.multiVideoEditor.widgetPlayerDirective).toEqual('cf-widget-player-directive');
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
      ShareJSMock.mkpathAndSetValue = sinon.stub().resolves();
      ShareJSMock.peek = sinon.stub();
      insertOpMock = jasmine.createSpyObj('insertOpMock', ['insert']);
      scope.otDoc  = {
        doc: jasmine.createSpyObj('otDocMock', ['at'])
      };
      scope.otDoc.doc.at.and.returnValue(insertOpMock);

      scope.otPath = 'ot-path';
    });

    describe('when there are already items in the document', function() {
      beforeEach(function() {
        ShareJSMock.peek.returns([]);
        multiVideoEditorController.storeAsset({assetId: 'asset-id'});
      });

      it('finds the path in the document', function() {
        expect(scope.otDoc.doc.at).toHaveBeenCalledWith(scope.otPath);
      });

      it('prepends the new asset', function() {
        expect(insertOpMock.insert).toHaveBeenCalledWith(0, 'asset-id', jasmine.any(Function));
      });
    });

    describe('when there are no items in the document', function() {
      beforeEach(function() {
        ShareJSMock.peek.returns();
        multiVideoEditorController.storeAsset({assetId: 'asset-id'});
      });

      it('creates a path in the document', function() {
        sinon.assert.calledOnce(ShareJSMock.mkpathAndSetValue);
        sinon.assert.calledWith(
          ShareJSMock.mkpathAndSetValue,
          scope.otDoc.doc, scope.otPath, ['asset-id']
        );
      });
    });

    describe('when the asset is successfully saved', function() {
      beforeEach(function() {
        scope.videoInputController = sinon.stub().returns({
          clearField: sinon.stub()
        });
        scope.multiVideoEditor.assets = ['other-asset'];

        multiVideoEditorController.storeAsset({assetId: 'asset-id'});
        this.$apply();
      });

      it('the new assed is prepended to the list of assets', function() {
        expect(scope.multiVideoEditor.assets[0].assetId).toEqual('asset-id');
      });

      it('clears the input field', function() {
        sinon.assert.calledOnce(scope.videoInputController().clearField);
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
