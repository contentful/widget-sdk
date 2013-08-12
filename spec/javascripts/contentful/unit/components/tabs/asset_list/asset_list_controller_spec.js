'use strict';

describe('Asset List Controller', function () {
  var controller, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($rootScope, $controller, SpaceContext) {
    $rootScope.spaceContext = new SpaceContext(window.createMockSpace());
    controller = $controller('AssetListCtrl', {$scope: $rootScope});
    scope = $rootScope;
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('changed list', function () {
    var makeAsset = function (sys) {
      var asset;
      inject(function (contentfulClient) {
        asset = new contentfulClient.Entity({ sys: sys });
      });
      return asset;
    };

    beforeEach(function () {
      scope.tab = {
        params: {
          list: 'changed'
        }
      };
    });

    it('should include unpublished assets in "changed" list', function () {
      var asset = makeAsset({
        version: 5
      });
      expect(scope.visibleInCurrentList(asset)).toBe(true);
    });

    it('should include updated assets in "changed" list', function () {
      var asset = makeAsset({
        publishedVersion: 2,
        version: 5
      });
      expect(scope.visibleInCurrentList(asset)).toBe(true);
    });

    it('should not include published assets without updates in"changed" list', function () {
      var asset = makeAsset({
        publishedVersion: 5,
        version: 5
      });
      expect(scope.visibleInCurrentList(asset)).toBe(false);
    });
  });

  it('file type group is returned for an asset', function () {
    var asset = window.createMockEntity('asset1');
    expect(scope.fileType(asset)).toBe('Image');
  });


});
