'use strict';

describe('signal', function () {
  beforeEach(module('cf.utils'));

  it('calls attached listeners', function () {

    var listeners = _.map(_.range(1,4), function () {
      return sinon.stub();
    });

    var signal = this.$inject('signal')();

    _.forEach(listeners, function (listener) {
      signal.attach(listener);
    });

    signal.dispatch('VALUE');

    _.forEach(listeners, function (l) {
      sinon.assert.calledWith(l, 'VALUE');
    });
  });

  it('does not call detached listeners', function () {
    var listener = sinon.stub();

    var signal = this.$inject('signal')();

    var detach = signal.attach(listener);

    signal.dispatch();
    sinon.assert.calledOnce(listener);

    detach();
    signal.dispatch();
    sinon.assert.calledOnce(listener);
  });
});
