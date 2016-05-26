'use strict';

describe('AssetResolver service', function () {

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
    this.resolve = this.$inject('AssetResolver').resolve;
  });

  it('returns the correct URL', function () {
    var path = 'images/my-asset.jpg';
    expect(this.resolve(path))
      .toBe('//static.test.com/images/fingerprinted.jpg');
  });

});
