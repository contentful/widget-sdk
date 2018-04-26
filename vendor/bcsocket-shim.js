/**
 * This module manually assigns BCSocket to the window.
 * The reason why actually have to do this -- in the source code,
 * `node_modules/browserchannel/dist/bcsocket-uncompressed.js`, you can a line:
 * ("undefined" !== typeof exports && null !== exports ? exports : window).BCSocket = $;
 *
 * We wrap all vendor files in a webpack, and webpack wraps each module in a function, which provides
 * three arguments: (module, exports, __webpack_require__). So `exports` clashes with the line above,
 * and therefore no assignment to the `window` happens (and it is required for ShareJS).
 */

import b from 'browserchannel/dist/bcsocket-uncompressed.js';

if (typeof window !== 'undefined') {
  window.BCSocket = b.BCSocket;
}
