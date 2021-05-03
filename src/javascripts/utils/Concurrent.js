/**
 * This modules exports control functions that help with concurrent and
 * asynchronous code.
 */

export * from './Concurrent/MVar';

export function sleep(t) {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}

/**
 * Wrap an asynchronous function so that only one task is running at
 * once.
 *
 *     let callCount = 0
 *     const exclusive = createExclusiveTask(() => {
 *       callCount++
 *       return sleep(100)
 *     })
 *
 *     const r1 = exclusive.call()
 *     const r2 = exclusive.call()
 *     assert(r1 === r2)
 *     assert(callCount === 1)
 *
 * Calling `call` on the return object calls `fn()` and returns the
 * result promise. Calling `call` a second time while the result
 * promise is not settled yet will not call `fn()` again. Instead it
 * will return the previous result promise. After the result is
 * settled, `call()` will call `fn()` again.
 */
export function createExclusiveTask(fn) {
  let resultPromise;

  return { call };

  function call() {
    if (!resultPromise) {
      resultPromise = fn().finally(() => {
        resultPromise = false;
      });
    }
    return resultPromise;
  }
}
