/* global document */
import { makeCtor } from 'utils/TaggedValues';

// TODO document

function makeHook (run) {
  return makeCtor((content) => {
    return { content, run };
  });
}


export const Ref = makeHook((el, prevEl, prevCb, cb) => {
  if (!el && prevCb) {
    prevCb(el);
  } else if (el !== prevEl && cb) {
    cb(el);
  }
  return el;
});


/**
 *
 * A hook that calls the given callback with `true` or `false` when
 * itself or any of its children is focused or unfocused.
 *
 *   h('div', {
 *     hooks: [ TrackFocus((isFocused) => {
 *       if (isFocused) {
 *         console.log('element was focused')
 *       } else {
 *         console.log('element was unfocused')
 *       }
 *     }]
 *   }, [
 *     // focusable children
 *   ])
 *
 * You can make any element focusable by setting the "tabindex"
 * attribute.
 *
 * If an element with this hooks is called for the first time, the
 * callback is called with the current focus state.
 *
 * Note that this differs from the default browser behavior in that an
 * element does not loose focus when the mouse leaves the browser
 * window.
 *
 * Note that this hook requires the "tabindex" attribute to be set on
 * the document’s body in order to track the focus properly.
 */
export const TrackFocus = makeHook((el, focusManager, _prev, setHasFocus) => {
  if (focusManager) {
    if (setHasFocus) {
      focusManager.setCallback(setHasFocus);
      return focusManager;
    } else {
      focusManager.destroy();
      return;
    }
  } else if (setHasFocus) {
    return createFocusManager(el, setHasFocus);
  }
});


/**
 * A focus manager can be attached to an element to track whether it is
 * focused or not. It is used by the `TrackFocus` hook
 *
 * The `setIsFocused` parameter is a callback that is called with
 * `true` when any element that is a child of the given element
 * receives focus. The callback is called with `false` if any element
 * that is not a child of the given element receives focus.
 *
 * The `setIsFocused` callback is called with the initial focus state
 * when the focus manager is created. It is only called when the focus
 * value actually changes from `true` to `false` or vice versa.
 *
 * The `setIsFocused` callback can be replaced by using `setCallback`
 * on the returned focus manager.
 *
 * To stop listening, call `destroy()` on the returned focus manager
 * object.
 */
function createFocusManager (el, setIsFocused) {
  if (!document.body.getAttribute('tabindex')) {
    throw new Error('The focus manager requires the "tabindex" attribute on the document body');
  }

  let isFocused = false;
  setFocusIfChanged(isParent(el, document.activeElement));
  document.addEventListener('focusin', listener);

  return {
    setCallback (newCb) {
      setIsFocused = newCb;
    },
    destroy () {
      document.removeEventListener('focusin', listener);
    }
  };

  function listener (ev) {
    setFocusIfChanged(isParent(el, ev.target));
  }

  function setFocusIfChanged (nextIsFocused) {
    if (isFocused !== nextIsFocused) {
      isFocused = nextIsFocused;
      if (setIsFocused) {
        setIsFocused(isFocused);
      }
    }
  }
}


/**
 * Receives two elements and returns true iff the first element is a
 * parent of the second. Both parameters maybe falsy.
 *
 * @param {DOM.Element?} parentElement
 * @param {DOM.Element?} maybeChildElement
 * @returns {boolean}
 */
function isParent (parentElement, maybeChildElement) {
  let currentElement = maybeChildElement;
  while (currentElement) {
    if (currentElement === parentElement) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }
  return false;
}
