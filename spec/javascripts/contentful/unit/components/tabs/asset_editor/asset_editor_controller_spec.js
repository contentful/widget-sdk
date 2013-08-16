'use strict';

describe('Asset editor controller', function () {

  var scope;
  var assetEditorCtrl;
  var getPublishLocalesStub, assetTitleStub, canStub;

  beforeEach(function () {
    module('contentful/test');
    module(function ($provide) {
      canStub = sinon.stub();
      // TODO maybe extract into
      $provide.value('can', canStub);
    });

    inject(function (_$rootScope_, $controller) {
      scope = _$rootScope_;

      scope.tab = {};
      var locale = {
        code: 'en-US',
        contentDeliveryApi: true,
        contentManagementApi: true,
        'default': true,
        name: 'en-US',
        publish: true
      };
      getPublishLocalesStub = sinon.stub();
      getPublishLocalesStub.returns([locale]);
      assetTitleStub = sinon.stub();
      scope.spaceContext = {
        assetTitle: assetTitleStub,
        space: {
          getPublishLocales: getPublishLocalesStub
        }
      };

      assetEditorCtrl = $controller('AssetEditorCtrl', {$scope: scope});
      scope.$apply();
    });
  });

  it('gets a title set on a tab', function () {
    assetTitleStub.returns('title');
    scope.$apply();
    expect(scope.tab.title).toBe('title');
  });

  describe('sets the otDisabled flag', function () {
    var isArchivedStub;
    beforeEach(function () {
      isArchivedStub = sinon.stub();
      scope.asset = {
        isArchived: isArchivedStub
      };
      isArchivedStub.returns(false);
    });

    it('to disabled', function () {
      canStub.returns(true);
      scope.$apply();
      expect(scope.otDisabled).toBe(false);
    });

    it('to enabled', function () {
      canStub.returns(false);
      scope.$apply();
      expect(scope.otDisabled).toBe(true);
    });

  });

  describe('validation on publish', function () {
    beforeEach(inject(function ($compile, $rootScope, $controller){
      scope = $rootScope;
      var locale = {
        code: 'en-US',
        contentDeliveryApi: true,
        contentManagementApi: true,
        'default': true,
        name: 'en-US',
        publish: true
      };
      var asset = {
        data: {
          fields: {},
          sys: {publishedVersion: 1}
        },
        isArchived: sinon.stub().returns(false)
      };
      scope.spaceContext = {
        activeLocales: sinon.stub().returns([locale]),
        space: {
          getPublishLocales: sinon.stub().returns([locale])
        }
      };
      scope.tab = {
        params: {
          asset: asset
        }
      };
      assetEditorCtrl = $controller('AssetEditorCtrl', {$scope: $rootScope});
      scope.$digest();
    }));

    it('should validate if the published version has changed', function () {
      scope.validate = sinon.spy();
      scope.asset.data.sys.publishedVersion = 2;
      scope.$digest();
      expect(scope.validate.called).toBe(true);
    });
  });

  // TODO test dirty flag




});
