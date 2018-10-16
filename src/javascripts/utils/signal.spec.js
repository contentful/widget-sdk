import { create as createSignal, createMemoized } from './signal.es6';
import sinon from 'sinon';
import _ from 'lodash';

describe('utils/signal.es6', () => {
  describe('#create()', () => {
    it('calls attached listeners on dispatch', function() {
      const listeners = _.map(_.range(1, 4), () => sinon.stub());

      const signal = createSignal();

      _.forEach(listeners, listener => {
        signal.attach(listener);
      });

      signal.dispatch('VALUE');

      _.forEach(listeners, l => {
        expect(l.calledWith('VALUE')).toBeTruthy();
      });
    });

    it('does not call detached listeners', function() {
      const listener = sinon.stub();
      const signal = createSignal();
      const detach = signal.attach(listener);

      signal.dispatch();
      expect(listener.calledOnce).toBe(true);

      detach();
      signal.dispatch();
      expect(listener.calledOnce).toBe(true);
    });
  });

  describe('#createMemoized()', () => {
    it('sends initial value on attach with send option', function() {
      const signal = createMemoized('INITIAL');
      const listener = sinon.stub();

      signal.attach(listener, true);
      expect(listener.calledWithExactly('INITIAL')).toBe(true);
    });

    it('sends last value on attach with send option', function() {
      const signal = createMemoized();
      const listener = sinon.stub();

      signal.dispatch('VALUE');
      signal.attach(listener, true);
      expect(listener.calledWithExactly('VALUE')).toBe(true);
    });

    it('overides initial value when dispatched', function() {
      const signal = createMemoized('INITIAL');
      signal.dispatch('VALUE');

      const listener = sinon.stub();
      signal.attach(listener, true);
      expect(listener.calledWithExactly('VALUE')).toBe(true);
    });
  });
});
