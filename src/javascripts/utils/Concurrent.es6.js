import $q from '$q';
import {makeCtor} from 'utils/TaggedValues';

/**
 * This modules exports control functions that help with concurrent and
 * asynchronous code.
 */


export * from './Concurrent/MVar';


// Constructors for promise results;
export const Success = makeCtor('PromiseSuccess');
export const Failure = makeCtor('PromiseFailure');


export function sleep (t) {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}


/**
 * Takes a promise and returns a promise with a result based on wether
 * the promise resolved or rejected.
 *
 *     const result = yield tryP(foo())
 *     const maybeValue = match(result, {
 *       [Success]: (value) => value
 *       [Failure]: (error) => {
 *         logError(error);
 *         return null;
 *       }
 *     })
 *
 * This provides a functional alternative for the following code
 *
 *     let maybeResult = null;
 *     try {
 *       maybeResult = yield foo();
 *     } catch (e) {
 *       logError(error);
 *     }
 */
export function tryP (promise) {
  return promise.then(
    (result) => Success(result),
    (error) => Failure(error)
  );
}


/**
 * Run a generator function that yields promises and return the final
 * promise.
 *
 *     function * myTask (value) {
 *       const result = yield Promise.resolve(value)
 *       return result
 *     }
 *
 *     runTask(myTask, true).then((val) => assert(val === true))
 *
 * This is a small, extendable implementation of the well known
 * Bluebird.coroutine.
 */
export function runTask (genFn, ...args) {
  return new Promise((resolve, reject) => {
    const gen = genFn(...args);
    onFulfilled();

    function onFulfilled (res) {
      try {
        next(gen.next(res));
      } catch (e) {
        reject(e);
      }
    }

    function onRejected (err) {
      try {
        next(gen.throw(err));
      } catch (e) {
        reject(e);
      }
    }

    function next ({done, value}) {
      if (done) {
        resolve(value);
      } else {
        if (!isThenable(value)) {
          reject(new Error('Yielded non-promise value'));
          return;
        }
        value.then(onFulfilled, onRejected);
      }
    }
  });
}

function isThenable (obj) {
  return obj &&
       typeof obj.then === 'function' &&
       typeof obj.catch === 'function';
}


/**
 * Takes a generator function and returns a function that when called
 * runs the generator as a task.
 *
 * This means the following are equivalent
 *     wrapTask(genFn)(...args)
 *     runTask(genFn, ...args)
 */
export function wrapTask (genFn) {
  return function (...args) {
    return runTask(genFn, ...args);
  };
}


/**
 * A slot attaches a callback to at most one promise at once.
 *
 * ~~~js
 * const put = createSlot ((result) => {
 *   match(result, {
 *     [Success]: (value) => {
 *       console.log('resolved with', value)
 *     },
 *     [Failure]: (error) => {
 *       console.log('rejected with', error)
 *     },
 *   })
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
 */
export function createSlot (onResult) {
  let currentId = 0;

  return function put (promise) {
    currentId += 1;
    const id = currentId;
    promise.then(
      (value) => onResultIfCurrent(id, Success(value)),
      (error) => onResultIfCurrent(id, Failure(error))
    );
  };

  function onResultIfCurrent (id, result) {
    if (id === currentId) {
      onResult(result);
    }
  }
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
export function createExclusiveTask (fn) {
  let resultPromise;

  return { call };

  function call () {
    if (!resultPromise) {
      resultPromise = fn().finally(() => {
        resultPromise = false;
      });
    }
    return resultPromise;
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
