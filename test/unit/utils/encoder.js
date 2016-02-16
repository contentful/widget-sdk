'use strict';

describe('encoder', function () {
  var encoder;

  var RAW = 'RAW_STRING';
  var ENCODED = 'HTML_ENCODED';

  var libraryMockInstance = {
    htmlEncode: sinon.stub().withArgs(RAW).returns(ENCODED),
    htmlDecode: sinon.stub().withArgs(ENCODED).returns(RAW)
  };

  beforeEach(function () {
    module('cf.utils', function ($provide) {
      $provide.constant('raw/htmlEncoder', {
        Encoder: function () {
          return libraryMockInstance;
        }
      });
    });
    encoder = this.$inject('encoder');
  });

  describe('.htmlEncode()', function () {
    it('calls respective function in used library', function () {
      expect(encoder.htmlEncode(RAW)).toBe(ENCODED);
    });

    it('does not require `encoder` as context', function () {
      expect(encoder.htmlEncode.bind(null)(RAW)).toBe(ENCODED);
    });
  });

  describe('.htmlDecode()', function () {
    it('calls respective function in used library', function () {
      expect(encoder.htmlDecode(ENCODED)).toBe(RAW);
    });

    it('does not require `encoder` as context', function () {
      expect(encoder.htmlDecode.bind(null)(ENCODED)).toBe(RAW);
    });
  });
});
