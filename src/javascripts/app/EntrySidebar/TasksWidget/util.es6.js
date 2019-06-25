import * as K from 'utils/kefir.es6';
import { isEqual } from 'lodash';

/**
 * Starts observing a given store (like e.g. TasksStore) and invokes the given
 * `onChange` with updated loading stages.
 *
 * NOTE: This is built with the ability in mind to repeatedly refresh the store
 *  to keep the frontend in sync with other users changes.
 *
 * @param {Object} store Currently anything with an `items$` Kefir prop qualifies.
 * @param {Function} onChange Will be invoked with current changed `status`.
 * @returns {Function} Invoke to unsubscribe from changes.
 */
export function onStoreFetchingStatusChange(store, onChange) {
  const initial = {
    isLoading: true,
    data: null,
    error: null
  };
  const update$ = store.items$
    .ignoreErrors()
    .filter(data => data !== null)
    .map(data => ({
      isLoading: false,
      data,
      error: null
    }));
  const error$ = store.items$
    .ignoreValues()
    .mapErrors(error => ({
      isLoading: false,
      error
    }))
    .withHandler(errorsAsValuesHandler);
  return update$
    .merge(error$)
    .scan((prev, next) => ({ ...prev, ...next }), initial)
    .skipDuplicates(isEqual)
    .observe(onChange).unsubscribe;
}

/**
 * Same as `onStoreFetchingStatusChange` but just takes a promise instead of a store
 * while invoking `onChange` with equivalent status objects.
 *
 * @param {Promise} promise
 * @param {Function} onChange Will be invoked with current changed `status`.
 * @returns {Function} Invoke to unsubscribe from changes.
 */
export function onPromiseFetchingStatusChange(promise, onChange) {
  const fakeStore = { items$: K.fromPromise(promise) };
  return onStoreFetchingStatusChange(fakeStore, onChange);
}

function errorsAsValuesHandler(emitter, event) {
  if (event.type === 'error') {
    emitter.value(event.value);
  }
}
