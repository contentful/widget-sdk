import { getModule } from 'NgRegistry.es6';

const $q = getModule('$q');

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
export function createQueue() {
  let running;
  const pending = [];
  return { push };

  function push(run) {
    if (typeof run !== 'function') {
      throw new Error('Can only push functions into queue');
    }
    const deferred = $q.defer();
    pending.push({ run, deferred });
    if (!running) {
      shift();
    }

    return deferred.promise;
  }

  function shift() {
    const item = pending.shift();
    if (item) {
      const { run, deferred } = item;
      running = true;
      run().then(
        value => {
          deferred.resolve(value);
          shift();
        },
        error => {
          deferred.reject(error);
          shift();
        }
      );
    } else {
      running = false;
    }
  }
}
