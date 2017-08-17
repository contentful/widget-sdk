import $q from '$q';

/**
 * This modules exports control functions that help with concurrent and
 * asynchronous code.
 */


export {default as createMVar} from './Concurrent/MVar';


/**
 * A slot attaches a callback to at most one promise at once.
 *
 * ~~~js
 * const put = createSlot ((result) => {
 *   if (result.type === 'success') {
 *     console.log('resolved with', result.value)
 *   } else if (result.type === 'error') {
 *     console.log('rejected with', result.error)
 *   }
 * })
 *
 * put(promiseA)
 * put(promiseB)
 * // forgets about promiseA and only calls handler when promiseB is
 * // resolved
 * ~~~
 *
 * The 'createSlot()` function returns a function that puts a promise
 * into the slot. If the promise is resolved or rejected the callback
 * is called with the result.
 *
 * Putting another promise into the slot removes the old one and the
 * callback will not be called when the removed promise is done.
 *
 * A good use case is when a user action triggers an asynchronous
 * request which in turn updates a view.
 *
 */
export function createSlot (onResult) {
  let currentId = 0;

  return function put (promise) {
    currentId += 1;
    const id = currentId;
    promise.then(
      (value) => onResultIfCurrent(id, {type: 'success', value}),
      (error) => onResultIfCurrent(id, {type: 'error', error})
    );
  };

  function onResultIfCurrent (id, result) {
    if (id === currentId) {
      onResult(result);
    }
  }
}


/**
 * Create a queue of asynchronous tasks that are run sequentially.
 *
 * Push a function that returns a promise to the queue and the function
 * only gets executed when all previously pushed tasks have finished.
 *
 * 'push' returns a promise that resolves when the function is run and
 * the returned promise is resolved.
 *
 *     const q = createQueue()
 *
 *     const done1 = q.push(() => { log('1'); return delay(100) })
 *     const done2 = q.push(() => { log('2'); return delay(100) })
 *     const done3 = q.push(() => { log('3'); return delay(100) })
 *     // logs 1
 *     // after 100ms done1 resolves and logs 2
 *     // after 100ms done2 resolves and logs 3
 *
 */
export function createQueue () {
  let running;
  const pending = [];
  return { push };

  function push (run) {
    if (typeof run !== 'function') {
      throw new Error('Can only push functions into queue');
    }
    const deferred = $q.defer();
    pending.push({run, deferred});
    if (!running) {
      shift();
    }

    return deferred.promise;
  }

  function shift () {
    const item = pending.shift();
    if (item) {
      const { run, deferred } = item;
      running = true;
      run().then((value) => {
        deferred.resolve(value);
        shift();
      }, (error) => {
        deferred.reject(error);
        shift();
      });
    } else {
      running = false;
    }
  }
}
