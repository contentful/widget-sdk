import sinon from 'npm:sinon';

// TODO Global 'sinon' is deprecated but still used by a lot of test
// files.
window.sinon = sinon;

export const stub = sinon.stub;
export const spy = sinon.spy;
export const assert = sinon.assert;
export const useFakeTimers = sinon.useFakeTimers;
export const sandbox = sinon.sandbox;

sinon.addBehavior('resolves', (stub, value) => {
  stub.callsFake(() => get$q().resolve(value));
});

sinon.addBehavior('rejects', (stub, value) => {
  stub.callsFake(() => get$q().reject(value));
});

sinon.stub.defers = function () {
  const deferred = get$q().defer();
  this.returns(deferred.promise);
  this.resolve = deferred.resolve.bind(deferred);
  this.reject = deferred.reject.bind(deferred);
  return this;
};

export function stubAll (object) {
  /* eslint prefer-const: off */
  for (let key in object) {
    if (typeof object[key] === 'function') {
      sinon.stub(object, key);
    }
  }
  return object;
}

function get$q () {
  let $q;
  inject(function (_$q_) {
    $q = _$q_;
  });
  return $q;
}
