'use strict';

describe('signal', () => {
  beforeEach(() => {
    module('cf.utils');
  });

  describe('#create()', () => {
    beforeEach(function () {
      this.createSignal = this.$inject('signal').create;
    });

    it('calls attached listeners on dispatch', function () {
      const listeners = _.map(_.range(1,4), () => sinon.stub());

      const signal = this.createSignal();

      _.forEach(listeners, listener => {
        signal.attach(listener);
      });

      signal.dispatch('VALUE');

      _.forEach(listeners, l => {
        sinon.assert.calledWith(l, 'VALUE');
      });
    });

    it('does not call detached listeners', function () {
      const listener = sinon.stub();
      const signal = this.createSignal();
      const detach = signal.attach(listener);

      signal.dispatch();
      sinon.assert.calledOnce(listener);

      detach();
      signal.dispatch();
      sinon.assert.calledOnce(listener);
    });
  });

  describe('#createMemoized()', () => {
    beforeEach(function () {
      this.createSignal = this.$inject('signal').createMemoized;
    });

    it('sends initial value on attach with send option', function () {
      const signal = this.createSignal('INITIAL');
      const listener = sinon.stub();

      signal.attach(listener, true);
      sinon.assert.calledWithExactly(listener, 'INITIAL');
    });

    it('sends last value on attach with send option', function () {
      const signal = this.createSignal();
      const listener = sinon.stub();

      signal.dispatch('VALUE');
      signal.attach(listener, true);
      sinon.assert.calledWithExactly(listener, 'VALUE');
    });

    it('overides initial value when dispatched', function () {
      const signal = this.createSignal('INITIAL');
      signal.dispatch('VALUE');

      const listener = sinon.stub();
      signal.attach(listener, true);
      sinon.assert.calledWithExactly(listener, 'VALUE');
    });
  });

});
