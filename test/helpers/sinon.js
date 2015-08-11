sinon.stub.resolves = function (value) {
  return this.returns(get$q().when(value));
};

sinon.stub.rejects = function (err) {
  return this.returns(get$q().reject(err));
};

function get$q () {
  var $q;
  inject(function (_$q_) {
    $q = _$q_
  })
  return $q
}

