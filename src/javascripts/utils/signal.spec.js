import { create as createSignal, createMemoized } from './signal.es6';
import _ from 'lodash';

describe('utils/signal.es6', () => {
  describe('#create()', () => {
    it('calls attached listeners on dispatch', function() {
      const listeners = _.map(_.range(1, 4), () => jest.fn());

      const signal = createSignal();

      _.forEach(listeners, listener => {
        signal.attach(listener);
      });

      signal.dispatch('VALUE');

      _.forEach(listeners, l => {
        expect(l).toHaveBeenCalledWith('VALUE');
      });
    });

    it('does not call detached listeners', function() {
      const listener = jest.fn();
      const signal = createSignal();
      const detach = signal.attach(listener);

      signal.dispatch();
      expect(listener).toHaveBeenCalledTimes(1);

      detach();
      signal.dispatch();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('#createMemoized()', () => {
    it('sends initial value on attach with send option', function() {
      const signal = createMemoized('INITIAL');
      const listener = jest.fn();

      signal.attach(listener, true);
      expect(listener).toHaveBeenLastCalledWith('INITIAL');
    });

    it('sends last value on attach with send option', function() {
      const signal = createMemoized();
      const listener = jest.fn();

      signal.dispatch('VALUE');
      signal.attach(listener, true);
      expect(listener).toHaveBeenCalledWith('VALUE');
    });

    it('overides initial value when dispatched', function() {
      const signal = createMemoized('INITIAL');
      signal.dispatch('VALUE');

      const listener = jest.fn();
      signal.attach(listener, true);
      expect(listener).toHaveBeenCalledWith('VALUE');
    });
  });
});
