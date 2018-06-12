'use strict';

describe('encoder', () => {
  let encoder;

  const RAW = 'RAW_STRING';
  const ENCODED = 'HTML_ENCODED';

  const libraryMockInstance = {
    htmlEncode: sinon.stub().withArgs(RAW).returns(ENCODED),
    htmlDecode: sinon.stub().withArgs(ENCODED).returns(RAW)
  };

  beforeEach(function () {
    module('cf.utils', $provide => {
      $provide.constant('raw/htmlEncoder', {
        Encoder: function () {
          return libraryMockInstance;
        }
      });
    });
    encoder = this.$inject('encoder');
  });

  describe('.htmlEncode()', () => {
    it('calls respective function in used library', () => {
      expect(encoder.htmlEncode(RAW)).toBe(ENCODED);
    });

    it('does not require `encoder` as context', () => {
      expect(encoder.htmlEncode.bind(null)(RAW)).toBe(ENCODED);
    });
  });

  describe('.htmlDecode()', () => {
    it('calls respective function in used library', () => {
      expect(encoder.htmlDecode(ENCODED)).toBe(RAW);
    });

    it('does not require `encoder` as context', () => {
      expect(encoder.htmlDecode.bind(null)(ENCODED)).toBe(RAW);
    });
  });
});
