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
export function createMVar(value) {
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
export function createMVar$q(value) {
  return createBase($q, !arguments.length, value);
}

// `initialEmpty` is used to distinguish between providing `undefined` as an
// initial value or no initial value at all.
function createBase(PromiseImplementation, initialEmpty, value) {
  let readDeferred = makeDeferred(PromiseImplementation);
  let isEmpty = true;

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
      readDeferred = makeDeferred(PromiseImplementation);
      isEmpty = true;
    }
  }

  function put(value) {
    if (isEmpty) {
      readDeferred.resolve(value);
    } else {
      readDeferred = makeDeferred(PromiseImplementation);
      readDeferred.resolve(value);
    }

    isEmpty = false;
  }
}

// TODO we should probably extract this
function makeDeferred(PromiseImplementation) {
  let resolve, reject;
  // eslint-disable-next-line promise/param-name
  const promise = new PromiseImplementation((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });
  return { promise, resolve, reject };
}
