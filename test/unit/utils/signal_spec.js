'use strict';

describe('signal', function () {
  var createSignal;

  beforeEach(function () {
    module('cf.utils');
    createSignal = this.$inject('signal');
  });

  it('calls attached listeners on dispatch', function () {
    var listeners = _.map(_.range(1,4), function () {
      return sinon.stub();
    });

    var signal = createSignal();

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
    var signal = createSignal();
    var detach = signal.attach(listener);

    signal.dispatch();
    sinon.assert.calledOnce(listener);

    detach();
    signal.dispatch();
    sinon.assert.calledOnce(listener);
  });

  it('sends initial value on attach with send option', function () {
    var signal = createSignal('INITIAL');
    var listener = sinon.stub();

    signal.attach(listener, true);
    sinon.assert.calledWithExactly(listener, 'INITIAL');
  });

  it('sends last value on attach with send option', function () {
    var signal = createSignal();
    var listener = sinon.stub();

    signal.dispatch('VALUE');
    signal.attach(listener, true);
    sinon.assert.calledWithExactly(listener, 'VALUE');
  });

  it('overides initial value when dispatched', function () {
    var signal = createSignal('INITIAL');
    signal.dispatch('VALUE');

    var listener = sinon.stub();
    signal.attach(listener, true);
    sinon.assert.calledWithExactly(listener, 'VALUE');
  });

});
