import { registerFactory } from 'NgRegistry.es6';
import htmlEncoder from 'node-html-encoder';

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
registerFactory('encoder', () => {
  const encoder = htmlEncoder.Encoder();

  return {
    htmlEncode: encoder.htmlEncode.bind(encoder),
    htmlDecode: encoder.htmlDecode.bind(encoder)
  };
});
