import { isSecureAssetUrl } from 'utils/AssetUrl';

describe('isSecureAssetUrl', () => {
  it('returns false for non-secure urls', () => {
    expect(isSecureAssetUrl('//images.contentful.com/space-id/asset-id/hash/thing.png')).toBe(
      false
    );
    expect(isSecureAssetUrl('https://images.contentful.com/space-id/asset-id/hash/thing.png')).toBe(
      false
    );
    expect(isSecureAssetUrl('http://assets.ctfassets.net/space-id/asset-id/hash/thing.png')).toBe(
      false
    );
    expect(isSecureAssetUrl('http://secure.ctfassets.net/space-id/asset-id/hash/thing.png')).toBe(
      false
    );
  });

  it('returns true for secure urls', () => {
    expect(isSecureAssetUrl('//images.secure.ctfassets.net/space-id/asset-id/hash/thing.png')).toBe(
      true
    );
    expect(
      isSecureAssetUrl('https://images.secure.contentful.com/space-id/asset-id/hash/thing.png')
    ).toBe(true);
    expect(
      isSecureAssetUrl('http://assets.secure.flinkly.com/space-id/asset-id/hash/thing.png')
    ).toBe(true);
  });

  it('returns false for non-strings', () => {
    expect(isSecureAssetUrl({ imATeapot: true })).toBe(false);
  });
});
