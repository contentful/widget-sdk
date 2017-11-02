'use strict';

describe('AssetResolver service', function () {
  beforeEach(function () {
    module('contentful/test');
    const manifest = this.$inject('environment').manifest;
    manifest['asset.jpg'] = 'http://fingerprinted.jpg';

    this.resolve = this.$inject('AssetResolver').resolve;
  });

  it('resolves a URL in the manifest', function () {
    expect(this.resolve('asset.jpg')).toBe('http://fingerprinted.jpg');
  });

  it('throws when URL is not in manifest', function () {
    expect(function () {
      this.resolve('unknonw');
    }.bind(this)).toThrow();
  });
});
