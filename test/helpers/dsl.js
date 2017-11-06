'use strict';

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
          return runGenerator(result);
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
 * Given a generator that yields promises and a $scope.$apply method
 * this function returns a promise.
 *
 * The $apply function is called whenever a promise is yielded from the
 * generator. This is necessary to flush values to handlers in
 * Angular’s promise implementation.
 *
 * Not that the actual promise is not an Angular promise but the native
 * implementation.
 *
 * TODO This is very similar to `runTask` in `utils/Concurrent`. We
 * should merge the code.
 */
function runGenerator (gen, $apply) {
  return new Promise((resolve, reject) => {
    const next = makeDispatcher('next');
    const throwTo = makeDispatcher('throw');

    next();

    function makeDispatcher (method) {
      return function (val) {
        let ret;
        try {
          ret = gen[method](val);
        } catch (e) {
          reject(e);
          return;
        }

        handleYield(ret);
      };
    }

    function handleYield (ret) {
      if (ret.done) {
        resolve();
      } else {
        if (!isThenable(ret.value)) {
          reject(new Error('Yielded non-promise value'));
        }
        // We need to wrap this in a native promise to escape the digest/apply
        // loop. We also cannot use Promise.resolve as it does not work with the
        // Angular promise implementation.
        (new Promise((resolve, reject) => {
          ret.value.then(resolve, reject);
        }))
        .then(next, throwTo);
        // Repeatedly run $apply() to flush all promises
        try {
          if ($apply) {
            _.times(5, () => $apply());
          }
        } catch (error) {
          throwTo(error);
        }
      }
    }
  });
}
