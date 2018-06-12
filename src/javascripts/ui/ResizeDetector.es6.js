import * as K from 'utils/kefir';
import makeDetector from 'element-resize-detector';

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
export function observeResize (element) {
  return K.stream((emitter) => {
    const detector = makeDetector({strategy: 'scroll'});
    detector.listenTo(element, listen);

    return () => {
      detector.uninstall(element);
    };

    function listen () {
      emitter.emit();
    }
  });
}
