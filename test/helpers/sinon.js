import sinon from 'sinon';
import { $q } from 'test/utils/ng';

sinon.assert.calledOnceWith = (spy, ...args) => {
  sinon.assert.calledOnce(spy);
  sinon.assert.calledWith(spy, ...args);
};

// We need to call the $q methods lazily because the angular injector
// might not yet be created.
sinon.addBehavior('resolves', (stub, value) => {
  stub.callsFake(() => $q.resolve(value));
});

sinon.addBehavior('rejects', (stub, value) => {
  stub.callsFake(() => $q.reject(value));
});

sinon.stub.defers = function () {
  const deferred = $q.defer();
  this.returns(deferred.promise);
  this.resolve = deferred.resolve.bind(deferred);
  this.reject = deferred.reject.bind(deferred);
  return this;
};
