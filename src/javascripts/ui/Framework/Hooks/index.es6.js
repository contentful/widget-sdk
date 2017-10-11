/* global document */
import { makeCtor } from 'utils/TaggedValues';

// TODO document

function makeHook (run) {
  return makeCtor((content) => {
    return { content, run };
  });
}

/**
 * A hook that takes a function as an argument. The function is called
 * whenever a click event was triggered on the document that did not
 * originate within the element this hooks is attached to.
 */
export const ClickBlur = makeHook((el, listener, _prev, next) => {
  const state = { el, cb: next };
  if (listener) {
    if (next) {
      listener.setState(state);
      return listener;
    } else {
      listener.remove();
      return;
    }
  } else if (next) {
    return createListener(document, 'click', state, (ev, { cb, el }) => {
      if (ev.path.indexOf(el) === -1) {
        cb();
      }
    });
  }
});


/**
 * Create a state ful event listener.
 *
 * Everytime `eventName` is fired on `target` we call `fn` with the
 * event and `state` as arguments.
 *
 * The `setState()` method lets one change the state we want to pass to
 * the event.
 *
 * The `remove()` method removes the listener from the target.
 */
function createListener (target, eventName, state, fn) {
  target.addEventListener(eventName, listener);
  return {
    setState (nextState) {
      state = nextState;
    },
    remove () {
      target.removeEventListener(eventName, listener);
    }
  };

  function listener (event) {
    fn(event, state);
  }
}


export const Ref = makeHook((el, prevEl, prevCb, cb) => {
  if (!el && prevCb) {
    prevCb(el);
  } else if (el !== prevEl && cb) {
    cb(el);
  }
  return el;
});
