import { getDescriptorUrl } from './ExtensionFetcher';

describe('getDescriptorUrl', () => {
  describe('when passed a valid extension.js path', () => {
    it('returns the raw file url', () => {
      const result = getDescriptorUrl(
        'https://github.com/contentful/extensions/blob/master/samples/chessboard/extension.json'
      );
      expect(result).toEqual(
        'https://raw.githubusercontent.com/contentful/extensions/master/samples/chessboard/extension.json'
      );
    });
  });

  describe('when the path contains the word tree', () => {
    it('returns the raw file url', () => {
      // This test case is to demonstrate that a previous bug is fixed
      const result = getDescriptorUrl(
        'https://github.com/contentful/extensions/blob/master/samples/content-tree/extension.json'
      );
      expect(result).toEqual(
        'https://raw.githubusercontent.com/contentful/extensions/master/samples/content-tree/extension.json'
      );
    });
  });

  describe('when passed a path to a raw  extension.json file', () => {
    it('returns the raw file url', () => {
      const result = getDescriptorUrl(
        'https://raw.githubusercontent.com/contentful/extensions/master/samples/content-tree/extension.json'
      );
      expect(result).toEqual(
        'https://raw.githubusercontent.com/contentful/extensions/master/samples/content-tree/extension.json'
      );
    });
  });
});
