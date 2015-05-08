'use strict';

/**
 * Runs asynchronous specs that return a promise.
 *
 * ~~~js
 * pit('this is async', function () {
 *   return $q.when(false).
 *   then(function(res) {
 *     expect(res).toBe(true);
 *   });
 * });
 *
 * pit('this fails', function () {
 *   return $q.reject(new Error('oops'))).
 *   then(function(res) {
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

function createPromiseSpec (specFactory, desc, run) {
  var spec = specFactory(desc, function (done) {
    this.when(run.call(this))
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
