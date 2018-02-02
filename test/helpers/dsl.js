'use strict';

import { runTask } from 'utils/Concurrent';

_.extend(window, createDsl(window.jasmine.getEnv()));

function createDsl (jasmineDsl) {
  return {
    pit: createPromiseTestFactory(jasmineDsl.it),
    fpit: createPromiseTestFactory(jasmineDsl.fit),
    xpit: createPromiseTestFactory(jasmineDsl.xit),

    it: createCoroutineTestFactory(jasmineDsl.it),
    fit: createCoroutineTestFactory(jasmineDsl.fit),
    xit: createCoroutineTestFactory(jasmineDsl.xit),

    beforeEach: createHookFactory(jasmineDsl.beforeEach),
    afterEach: createHookFactory(jasmineDsl.afterEach)
  };
}


function createHookFactory (defineHook) {
  return function (runner) {
    defineHook(function (done) {
      Promise.resolve()
      .then(() => {
        const result = runner.call(this);
        if (isGenerator(result)) {
          const $apply = this.$apply.bind(this);
          return runGenerator(result, $apply);
        }
      })
      .then(done, done.fail);
    });
  };
}


// TODO deprecate this and use coroutines
function createPromiseTestFactory (specFactory) {
  return function (desc, run) {
    const spec = specFactory(desc, function (done) {
      const promise = run.call(this);

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
  };
}

function addException (spec, err) {
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

function createCoroutineTestFactory (testFactory) {
  return function (desc, runner, before) {
    if (!runner) {
      return testFactory(desc);
    }

    return testFactory(desc, function (done) {
      const $apply = this.$apply.bind(this);
      before = before || _.noop;
      const setup = this.setup || (() => Promise.resolve());
      return Promise.resolve(before.call(this))
        .then(() => {
          return setup.call(this);
        })
        .then((params) => {
          const result = runner.call(this, params);
          if (isGenerator(result)) {
            return runGenerator(result, $apply);
          }
        })
        .then(done, done.fail);
    });
  };
}

function isGenerator (g) {
  return g && typeof g.next === 'function' && typeof g.throw === 'function';
}


/**
 * Run a generator yielding promises as a task. In addition,
 * continiously call `$apply()` so that handlers of Angular promises
 * are called.
 *
 * The reason behind this is that if we attach a revole or reject
 * handler to an Angular promise that is already settled the handlers
 * will not be called until the next digest cycle. During testing we
 * must trigger digest cycles explicitly by calling `$apply`.
 */
// We need to guard against mocking of timing functions
const setInterval = window.setInterval;
const clearInterval = window.clearInterval;
function runGenerator (gen, $apply) {
  return runTask(function* () {
    const runApply = setInterval($apply, 10);
    try {
      yield* liftToNativePromise(gen);
    } catch (e) {
      clearInterval(runApply);
      throw e;
    }
    clearInterval(runApply);
  });
}

/**
 * Takes a generator that yields $q and native Promises and returns a
 * generator that only yields native Promises.
 *
 * We need this to be able to call `this.$apply()` after yielding a $q
 * promise
 *
 *    it('calls $apply', function* () {
 *      yield $q.resolve();
 *      this.$apply();
 *    })
 *
 * If we do not lift $q Promises the statement `this.$apply()` will be
 * called from the `then` handler of the promise and thus in an Angular
 * digest loop. Calling `$apply()` in a digest loop throws an
 * exception.
 */
function* liftToNativePromise (gen) {
  let input, error, didThrow;
  while (true) {
    const result = didThrow ? gen.throw(error) : gen.next(input);
    if (result.done) {
      return result.value;
    } else {
      try {
        input = yield Promise.resolve(result.value);
        error = null;
        didThrow = false;
      } catch (e) {
        error = e;
        input = null;
        didThrow = true;
      }
    }
  }
}
