'use strict';

describe('Asset editor controller', function () {

  var scope;
  var assetEditorCtrl;
  var getPublishLocalesStub, assetTitleStub, canStub;

  beforeEach(function () {
    module('contentful/test');
    module(function ($provide) {
      canStub = sinon.stub();
      $provide.value('can', canStub);
    });

    inject(function (_$rootScope_, $controller) {
      scope = _$rootScope_;

      scope.tab = {};
      getPublishLocalesStub = sinon.stub();
      getPublishLocalesStub.returns([]);
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


  // TODO test dirty flag




});
