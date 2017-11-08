import * as K from 'utils/kefir';
import $q from '$q';


/**
 * @ngdoc method
 * @name utils/Concurrent/MVar#create
 * @description
 * Creates an MVar that can either hold a value or be empty, and has the
 * following methods:
 *
 * `mVar.put(value)` sets current value,
 * `mVar.take()` returns a promise that resolves with value as soon as it is
 * set, and sets current state to empty.
 *
 * It also implements two additional helper methods:
 * `mVar.empty()` sets current state to empty,
 * `mVar.read()` returns a promise that resolves with value as soon as it is
 * set, without emptying the state.
 *
 * @params {Object} value
 * @returns {utils/Concurrent/MVar}
 */
export function createMVar (value) {
  return createBase(Promise, !arguments.length, value);
}


/**
 * @description
 * Create an MVar that uses Angular’s $q Promise internally.
 *
 * We still need a $q based implementation because some code relies on
 * the fact that handlers on $q trigger Angular digest cycles that
 * updated the application state.
 */
export function createMVar$q (value) {
  return createBase($q, !arguments.length, value);
}


// `isEmpty` is used to distinguish between providing `undefined` as an
// initial value or no initial value at all.
function createBase (PromiseImplementation, isEmpty, value) {
  // @todo it can be implemented without Kefir, just promises
  const bus = K.createPropertyBus();
  const value$ = bus.property.flatten(function (x) {
    return x.isEmpty ? [] : [x.value];
  });

  let state;
  if (isEmpty) {
    empty();
  } else {
    put(value);
  }

  return {
    read: read,
    take: take,
    empty: empty,
    put: put,
    isEmpty: function () { return state.isEmpty; }
  };

  function setState (newState) {
    state = newState;
    bus.set(newState);
  }

  function read () {
    if (state.isEmpty) {
      return value$.take(1).toPromise(PromiseImplementation);
    } else {
      return PromiseImplementation.resolve(state.value);
    }
  }

  function take () {
    return read().then(function (value) {
      empty();
      return value;
    });
  }

  function empty () {
    setState({ isEmpty: true });
  }

  function put (value) {
    setState({ isEmpty: false, value: value });
  }
}
