'use strict';

describe('Asset loader service', function () {

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        settings: {
          asset_host: 'static.test.com'
        },
        manifest: {
          'images/my-asset.jpg': 'images/fingerprinted.jpg'
        }
      });
    });
    this.assetLoader = this.$inject('AssetLoader');
  });

  it('returns the correct URL', function () {
    var path = 'images/my-asset.jpg';
    expect(this.assetLoader.getAssetUrl(path))
      .toBe('//static.test.com/images/fingerprinted.jpg');
  });

});
