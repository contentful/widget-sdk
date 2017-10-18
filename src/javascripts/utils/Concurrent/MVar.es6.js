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
export default function create (value) {
  let state = { isEmpty: !arguments.length, value: value };

  // @todo it can be implemented without Kefir, just promises
  const bus = K.createPropertyBus(state);
  const value$ = bus.property.flatten(function (x) {
    return x.isEmpty ? [] : [x.value];
  });

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
      // resolve after next value is set
      return value$.take(1).toPromise($q);
    } else {
      // value is here, resolve immediately
      return $q.resolve(state.value);
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
