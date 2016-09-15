'use strict';

describe('Multi Video Editor Controller', function () {
  let scope, multiVideoEditorController;

  afterEach(function () {
    scope = multiVideoEditorController = null;
  });

  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');

    scope = $rootScope.$new();
    scope.providerVideoEditorController = {
      widgetPlayerDirective: 'cf-widget-player-directive'
    };
    const videoInputController = {
      clearField: sinon.stub()
    };
    scope.videoInputController = sinon.stub().returns(videoInputController);

    const widgetApi = this.$inject('mocks/widgetApi').create();
    this.fieldApi = widgetApi.field;

    multiVideoEditorController = $controller('cfMultiVideoEditorController', {
      $scope: scope,
      widgetApi: widgetApi
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('multiVideoEditor scope properties', function () {
    describe('#onSelection search config method', function () {
      beforeEach(function () {
        this.fieldApi.setValue = sinon.stub().resolves();
      });

      it('inserts each selected asset', function () {
        scope.multiVideoEditor.assets = [{assetId: 'A'}];
        const selection = [{id: 'B'}, {id: 'C'}];
        scope.multiVideoEditor.searchConfig.onSelection(selection);
        sinon.assert.calledOnce(this.fieldApi.setValue);
        sinon.assert.calledWithExactly(this.fieldApi.setValue, ['B', 'C', 'A']);
      });
    });

    it('sets the "widgetPlayerDirective" property to the value of the "$attrs.widgetPlayerDirective"', function () {
      expect(scope.multiVideoEditor.widgetPlayerDirective).toEqual('cf-widget-player-directive');
    });
  });

  describe('#customAttrsForPlayer', function () {
    beforeEach(function () {
      scope.providerVideoEditorController.customAttrsForPlayer = sinon.stub().returns('attrs');
    });

    it('calls the #customAttrsForPlayer callback method on the provider editor controller', function () {
      multiVideoEditorController.customAttrsForPlayer('asset');
      sinon.assert.calledWithExactly(
        scope.providerVideoEditorController.customAttrsForPlayer,
        'asset'
      );
    });

    it('returns the value returned from the callback', function () {
      const customAttrs = multiVideoEditorController.customAttrsForPlayer('asset');
      expect(customAttrs).toEqual('attrs');
    });
  });

  describe('#isVideoWidgetReady', function () {
    beforeEach(function () {
      scope.providerVideoEditorController.isWidgetReady = sinon.stub().returns('READY');
    });

    it('calls the #isWidgetReady callback method on the provider editor controller', function () {
      multiVideoEditorController.isVideoWidgetReady();
      sinon.assert.calledOnce(scope.providerVideoEditorController.isWidgetReady);
    });

    it('returns the value returned from the callback', function () {
      const isReady = multiVideoEditorController.isVideoWidgetReady();
      expect(isReady).toBe('READY');
    });
  });

  describe('#storeAsset', function () {
    beforeEach(function () {
      this.fieldApi.insertValue = sinon.stub().resolves();
    });

    it('prepends the new asset', function () {
      multiVideoEditorController.storeAsset({assetId: 'asset-id'});
      sinon.assert.calledOnce(this.fieldApi.insertValue);
      sinon.assert.calledWithExactly(this.fieldApi.insertValue, 0, 'asset-id');
    });

    describe('when the asset is successfully saved', function () {
      beforeEach(function () {
        scope.videoInputController = sinon.stub().returns({
          clearField: sinon.stub()
        });
        scope.multiVideoEditor.assets = ['other-asset'];

        multiVideoEditorController.storeAsset({assetId: 'asset-id'});
        this.$apply();
      });

      it('the new assed is prepended to the list of assets', function () {
        expect(scope.multiVideoEditor.assets[0].assetId).toEqual('asset-id');
      });

      it('clears the input field', function () {
        sinon.assert.calledOnce(scope.videoInputController().clearField);
      });
    });
  });

  describe('#lookupAsset', function () {
    beforeEach(function () {
      scope.providerVideoEditorController.lookupVideoInProvider = sinon.stub().returns('asset');
    });

    it('calls the #lookupVideoInProvider callback method on the provider editor controller', function () {
      multiVideoEditorController.lookupAsset('asset-1');
      sinon.assert.calledWithExactly(
        scope.providerVideoEditorController.lookupVideoInProvider,
        'asset-1'
      );
    });

    it('returns the value returned from the callback', function () {
      const asset = multiVideoEditorController.lookupAsset('asset-1');
      expect(asset).toEqual('asset');
    });
  });

  describe('#resetErrors', function () {
    beforeEach(function () {
      multiVideoEditorController.resetErrors();
    });

    it('sets the error to undefined', function () {
      expect(scope.multiVideoEditor.error).toBeUndefined();
    });
  });

  describe('#showErrors', function () {
    beforeEach(function () {
      multiVideoEditorController.showErrors({ message: 'error message' });
    });

    it('sets the errorMessage property to message property of the given error', function () {
      expect(scope.multiVideoEditor.error).toEqual('error message');
    });
  });
});
