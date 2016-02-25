'use strict';

/**
 * Runs asynchronous specs that return a promise.
 *
 * ~~~js
 * pit('this is async', function () {
 *   return $q.when(false)
 *   .then(function(res) {
 *     expect(res).toBe(true);
 *   });
 * });
 *
 * pit('this fails', function () {
 *   return $q.reject(new Error('oops')))
 *   .then(function(res) {
 *     expect(true).toBe(true);
 *   });
 * });
 * ~~~
 */
window.pit = function (desc, run) {
  return createPromiseSpec(window.it, desc, run);
};

window.ppit = function (desc, run) {
  return createPromiseSpec(window.iit, desc, run);
};

window.fpit = function (desc, run) {
  return createPromiseSpec(window.fit, desc, run);
};

function createPromiseSpec (specFactory, desc, run) {
  var spec = specFactory(desc, function (done) {
    var promise = run.call(this);

    if (!isThenable(promise)) {
      throw new TypeError('Promise test cases must return promise');
    }

    promise
    .catch(function (err) {
      addException(spec, err);
    })
    .finally(done);
    this.$apply();
  });
  return spec;
}

function addException(spec, err) {
  spec.addExpectationResult(false, {
    matcherName: '',
    passed: false,
    expected: '',
    actual: '',
    error: err
  });
}

function isThenable (obj) {
  return obj &&
       typeof obj.then === 'function' &&
       typeof obj.catch === 'function';
}
