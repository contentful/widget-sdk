'use strict';

sinon.stub.resolves = function (value) {
  return this.returns(get$q().when(value));
};

sinon.stub.rejects = function (err) {
  return this.returns(get$q().reject(err));
};

sinon.stub.defers = function () {
  var deferred = get$q().defer();
  this.returns(deferred.promise);
  this.resolve = deferred.resolve.bind(deferred);
  this.reject = deferred.reject.bind(deferred);
  return this;
};

function get$q () {
  var $q;
  inject(function (_$q_) {
    $q = _$q_;
  });
  return $q;
}

