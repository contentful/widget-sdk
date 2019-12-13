import { $apply } from 'test/utils/ng';
import _ from 'lodash';

const jasmineDsl = window.jasmine.getEnv();

export const it = createCoroutineTestFactory(jasmineDsl.it);
export const fit = createCoroutineTestFactory(jasmineDsl.fit);
export const xit = createCoroutineTestFactory(jasmineDsl.xit);
export const beforeEach = createHookFactory(jasmineDsl.beforeEach);
export const afterEach = createHookFactory(jasmineDsl.afterEach);

function createHookFactory(defineHook) {
  return runner => {
    defineHook(function(done) {
      Promise.resolve()
        .then(() => {
          const result = runner.call(this);

          if (isThenable(result)) {
            return runPromise(result, $apply);
          }
        })
        .then(done, done.fail);
    });
  };
}

function isThenable(obj) {
  return obj && typeof obj.then === 'function' && typeof obj.catch === 'function';
}

function createCoroutineTestFactory(testFactory) {
  return (desc, runner, before) => {
    if (!runner) {
      return testFactory(desc);
    }

    return testFactory(desc, function(done) {
      before = before || _.noop;
      const setup = this.setup || (() => Promise.resolve());
      return Promise.resolve(before.call(this))
        .then(() => {
          return setup.call(this);
        })
        .then(params => {
          const result = runner.call(this, params);

          // allow async/await/returning promise
          if (isThenable(result)) {
            return runPromise(result, $apply);
          }
        })
        .then(done, done.fail);
    });
  };
}

// We need to guard against mocking of timing functions
const setInterval = window.setInterval;
const clearInterval = window.clearInterval;

/**
 * Continiously calls `$apply()` so that handlers of Angular promises
 * are called. After promise is resolved/rejected, removes interval.
 *
 * The reason behind this is that if we attach a revole or reject
 * handler to an Angular promise that is already settled the handlers
 * will not be called until the next digest cycle. During testing we
 * must trigger digest cycles explicitly by calling `$apply`.
 */
function runPromise(promise, $apply) {
  const runApply = setInterval($apply, 10);
  promise.finally(() => clearInterval(runApply));

  return promise;
}
