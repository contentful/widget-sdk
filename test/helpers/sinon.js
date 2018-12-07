import sinon from 'sinon';
import $q from 'test/helpers/$q';

// TODO Global 'sinon' is deprecated but still used by a lot of test
// files.
window.sinon = sinon;

export const stub = sinon.stub;
export const spy = sinon.spy;
export const assert = sinon.assert;
export const match = sinon.match;
export const useFakeTimers = sinon.useFakeTimers;
export const sandbox = sinon.sandbox;

assert.calledOnceWith = (spy, ...args) => {
  assert.calledOnce(spy);
  assert.calledWith(spy, ...args);
};

// We need to call the $q methods lazily because the angular injector
// might not yet be created.
sinon.addBehavior('resolves', (stub, value) => {
  stub.callsFake(() => $q.resolve(value));
});

sinon.addBehavior('rejects', (stub, value) => {
  stub.callsFake(() => $q.reject(value));
});

sinon.stub.defers = function() {
  const deferred = $q.defer();
  this.returns(deferred.promise);
  this.resolve = deferred.resolve.bind(deferred);
  this.reject = deferred.reject.bind(deferred);
  return this;
};

export function stubAll(object) {
  /* eslint prefer-const: off */
  for (let key in object) {
    if (typeof object[key] === 'function') {
      sinon.stub(object, key);
    }
  }
  return object;
}
