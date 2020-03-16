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

// `initialEmpty` is used to distinguish between providing `undefined` as an
// initial value or no initial value at all.
export function createMVar(value) {
  let readDeferred = makeDeferred();
  let isEmpty = true;
  const initialEmpty = !arguments.length;

  if (!initialEmpty) {
    put(value);
  }

  return {
    read,
    take,
    empty,
    put,
    isEmpty: function() {
      return isEmpty;
    }
  };

  function read() {
    return readDeferred.promise;
  }

  function take() {
    return read().then(value => {
      empty();
      return value;
    });
  }

  function empty() {
    if (!isEmpty) {
      readDeferred = makeDeferred();
      isEmpty = true;
    }
  }

  function put(value) {
    if (isEmpty) {
      readDeferred.resolve(value);
    } else {
      readDeferred = makeDeferred();
      readDeferred.resolve(value);
    }

    isEmpty = false;
  }
}

// TODO we should probably extract this
function makeDeferred() {
  let resolve, reject;
  const promise = new Promise((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });
  return { promise, resolve, reject };
}
