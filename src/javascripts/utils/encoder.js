'use strict';

angular
  .module('cf.utils')
  /**
   * @ngdoc service
   * @module cf.utils
   * @name encoder
   * @usage[js]
   * var htmlEncode = require('encoder').htmlEncode;
   * console.log(
   *   htmlEncode('<script src="..."></script>') ==
   *   '&lt;script src=&quot;...&quot;&gt;&lt;/script&gt;');
   */
  .factory('encoder', [
    'raw/htmlEncoder',
    htmlEncoder => {
      var encoder = htmlEncoder.Encoder();

      return {
        htmlEncode: encoder.htmlEncode.bind(encoder),
        htmlDecode: encoder.htmlDecode.bind(encoder)
      };
    }
  ]);
