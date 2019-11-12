/**
 * @description
 * A service that records function calls while in the initial
 * open state. When the buffer is resolved, buffered computations
 * are executed.
 *
 * Afterwards, subsequent computations are executed immediately
 * and synchronously.
 *
 * Instead of resolving the buffer can also be disabled. That
 * discards all buffered function calls. Future calls are discarded
 * immediately.
 *
 * After being resolved or disabled, the buffer can not be
 * transitioned into another state anymore.
 */
const OPEN = 'open';
const RESOLVED = 'resolved';
const DISABLED = 'disabled';

export function create() {
  let calls = [];
  let state = OPEN;
  let service = null;

  return {
    call,
    resolve,
    disable
  };

  /**
   * @param {function} fn
   * @description
   * Depending on state, executes the function
   * or records it to execute in the future.
   * The function is called with a service
   * passed to `resolve`
   */
  function call(fn) {
    if (state === RESOLVED) {
      fn(service);
    } else if (state === OPEN) {
      calls.push(fn);
    }
  }

  /**
   * @param {any?} _service
   * @description
   * Executes recorded calls and marks buffer
   * as resolved.
   */
  function resolve(_service) {
    if (state === OPEN) {
      state = RESOLVED;
      service = _service;
      calls.forEach(fn => {
        fn(service);
      });
      calls = [];
    }
  }

  /**
   * @description
   * Discards all recorded calls and marks
   * buffer as disabled.
   */
  function disable() {
    state = DISABLED;
    calls = [];
  }
}
