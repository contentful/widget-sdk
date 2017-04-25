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
