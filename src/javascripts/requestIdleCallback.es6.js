/*
 * Shim for requestIdleCallback
 * @see https://developers.google.com/web/updates/2015/08/using-requestidlecallback
 */
window.requestIdleCallback =
  window.requestIdleCallback ||
  (cb => {
    return setTimeout(() => {
      const start = Date.now();
      cb({
        didTimeout: false,
        timeRemaining() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  });

window.cancelIdleCallback =
  window.cancelIdleCallback ||
  (id => {
    clearTimeout(id);
  });
