/**
 * var memoize = require('utils/memoize.es6').default;
 * var runOnce = memoize(function () {
 *   console.log('run')
 *   return true
 * })
 * runOnce() // Returns true and logs 'run'
 * runOnce() // Returns true
 */
function memoize(fn) {
  let result;
  let called = false;
  return () => {
    if (!called) {
      result = fn();
      called = true;
    }
    return result;
  };
}

export default memoize;
