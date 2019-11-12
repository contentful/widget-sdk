import * as K from 'utils/kefir';
import makeDetector from 'element-resize-detector';

/**
 * Subscribes to the element resize events using element-resize-detector
 */
const observeWithPolyfill = (element, cb) => {
  const detector = makeDetector({ strategy: 'scroll' });
  detector.listenTo(element, cb);

  return () => {
    detector.uninstall(element);
  };
};

/**
 * Creates an instance of ResizeObserver.
 * Tries to use native ResizeObserver if available
 * otherwise, uses polyfillObserver.
 */
const createResizeObserver = polyfillObserver => (element, cb) => {
  if ('ResizeObserver' in window) {
    const ro = new window.ResizeObserver(cb);
    ro.observe(element);
    return () => {
      ro.unobserve(element);
      ro.disconnect();
    };
  }

  return polyfillObserver(element, cb);
};

/**
 * Create a stream that emits an event whenever the size of the element changes.
 *
 * This function uses the [`element-resize-detector`][erd-lib] internally. This
 * means the following two caveats apply:
 * 1. If the element has `position: static` it will be changed to `position: relative`.
 * 2. A hidden element will be injected as a direct child to the element
 *
 * [erd-lib]: https://github.com/wnr/element-resize-detector
 *
 * @param {DOM.Element} element
 * @returns {K.Stream<void>}
 */
export function observeResize(element) {
  return K.stream(emitter => {
    const cb = () => emitter.emit();

    const unobserve = createResizeObserver(observeWithPolyfill)(element, cb);

    return () => {
      unobserve();
    };
  });
}
