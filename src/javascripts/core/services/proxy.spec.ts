import { proxify, useProxyState } from './proxy';
import { renderHook } from '@testing-library/react-hooks';

describe('proxify', () => {
  describe('array', () => {
    it('should be able to wrap an array', () => {
      const proxy = proxify([]);
      expect(Array.isArray(proxy)).toBe(true);
      expect(typeof proxy).toBe('object');
      expect(proxy).toHaveProperty('_proxy.subscribe');
      expect(proxy).toHaveProperty('_proxy.watch');
    });

    describe('subscribe', () => {
      it('should be able to subscribe to array changes', () => {
        const target: string[] = [];
        const proxy = proxify(target);
        const subscription = jest.fn();
        proxy._proxy.subscribe(subscription);
        proxy[0] = 'new';
        expect(subscription).toHaveBeenCalledTimes(1);
        expect(subscription).toHaveBeenCalledWith({
          key: '0',
          target: target,
          value: 'new',
        });
      });

      it('should be able to subscribe and unsubscribe to array changes', () => {
        const target: string[] = [];
        const proxy = proxify(target);
        const subscription1 = jest.fn();
        const subscription2 = jest.fn();
        proxy._proxy.subscribe(subscription1);
        const unsub = proxy._proxy.subscribe(subscription2);
        proxy[0] = 'new';
        const expected = {
          key: '0',
          target: target,
          value: 'new',
        };
        expect(subscription1).toHaveBeenCalledTimes(1);
        expect(subscription1).toHaveBeenCalledWith(expected);
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenCalledWith(expected);
        unsub();
        proxy[1] = 'item';
        expect(subscription1).toHaveBeenCalledTimes(2);
        expect(subscription1).toHaveBeenCalledWith({
          key: '1',
          target: target,
          value: 'item',
        });
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenLastCalledWith(expected);
      });
    });

    describe('watch', () => {
      it('should be able to watch array changes based on keys', () => {
        const target: string[] = [];
        const proxy = proxify(target);
        const subscription = jest.fn();
        proxy._proxy.watch([0, 2], subscription);
        proxy[0] = 'watch1';
        proxy[1] = 'unwatched';
        proxy[2] = 'watch2';
        expect(subscription).toHaveBeenCalledTimes(2);
        expect(subscription).toHaveBeenNthCalledWith(1, {
          key: '0',
          target: target,
          value: 'watch1',
        });
        expect(subscription).toHaveBeenNthCalledWith(2, {
          key: '2',
          target: target,
          value: 'watch2',
        });
      });

      it('should be able to watch and unwatch array changes', () => {
        const target: string[] = [];
        const proxy = proxify(target);
        const subscription1 = jest.fn();
        const subscription2 = jest.fn();
        proxy._proxy.watch([0, 1], subscription1);
        const unsub = proxy._proxy.watch([0, 1], subscription2);
        proxy[0] = 'new';
        proxy[2] = 'new unwatched';
        const expected = {
          key: '0',
          target: target,
          value: 'new',
        };
        expect(subscription1).toHaveBeenCalledTimes(1);
        expect(subscription1).toHaveBeenCalledWith(expected);
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenCalledWith(expected);
        unsub();
        proxy[1] = 'item';
        expect(subscription1).toHaveBeenCalledTimes(2);
        expect(subscription1).toHaveBeenCalledWith({
          key: '1',
          target: target,
          value: 'item',
        });
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenLastCalledWith(expected);
      });
    });
  });

  describe('object', () => {
    it('should be able to wrap an object', () => {
      const proxy = proxify({});
      expect(Array.isArray(proxy)).toBe(false);
      expect(typeof proxy).toBe('object');
      expect(proxy).toHaveProperty('_proxy.subscribe');
      expect(proxy).toHaveProperty('_proxy.watch');
    });

    describe('subscribe', () => {
      it('should be able to subscribe to object changes', () => {
        const target = {};
        const proxy = proxify(target);
        const subscription = jest.fn();
        proxy._proxy.subscribe(subscription);
        proxy['key'] = 'new';
        expect(subscription).toHaveBeenCalledTimes(1);
        expect(subscription).toHaveBeenCalledWith({
          key: 'key',
          target: target,
          value: 'new',
        });
      });

      it('should be able to subscribe and unsubscribe to object changes', () => {
        const target = {};
        const proxy = proxify(target);
        const subscription1 = jest.fn();
        const subscription2 = jest.fn();
        proxy._proxy.subscribe(subscription1);
        const unsub = proxy._proxy.subscribe(subscription2);
        proxy['key1'] = 'new';
        const expected = {
          key: 'key1',
          target: target,
          value: 'new',
        };
        expect(subscription1).toHaveBeenCalledTimes(1);
        expect(subscription1).toHaveBeenCalledWith(expected);
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenCalledWith(expected);
        unsub();
        proxy['key2'] = 'item';
        expect(subscription1).toHaveBeenCalledTimes(2);
        expect(subscription1).toHaveBeenCalledWith({
          key: 'key2',
          target: target,
          value: 'item',
        });
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenLastCalledWith(expected);
      });
    });

    describe('watch', () => {
      it('should be able to watch object changes based on keys', () => {
        const target = { key1: '', key2: '', key3: '' };
        const proxy = proxify(target);
        const subscription = jest.fn();
        proxy._proxy.watch(['key1', 'key3'], subscription);
        proxy['key1'] = 'watch1';
        proxy['key2'] = 'unwatched';
        proxy['key3'] = 'watch2';
        expect(subscription).toHaveBeenCalledTimes(2);
        expect(subscription).toHaveBeenNthCalledWith(1, {
          key: 'key1',
          target: target,
          value: 'watch1',
        });
        expect(subscription).toHaveBeenNthCalledWith(2, {
          key: 'key3',
          target: target,
          value: 'watch2',
        });
      });

      it('should be able to watch and unwatch object changes', () => {
        const target = { key1: '', key2: '', key3: '' };
        const proxy = proxify(target);
        const subscription1 = jest.fn();
        const subscription2 = jest.fn();
        proxy._proxy.watch(['key1', 'key2'], subscription1);
        const unsub = proxy._proxy.watch(['key1', 'key2'], subscription2);
        proxy['key1'] = 'new';
        proxy['key3'] = 'new unwatched';
        const expected = {
          key: 'key1',
          target: target,
          value: 'new',
        };
        expect(subscription1).toHaveBeenCalledTimes(1);
        expect(subscription1).toHaveBeenCalledWith(expected);
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenCalledWith(expected);
        unsub();
        proxy['key2'] = 'item';
        expect(subscription1).toHaveBeenCalledTimes(2);
        expect(subscription1).toHaveBeenCalledWith({
          key: 'key2',
          target: target,
          value: 'item',
        });
        expect(subscription2).toHaveBeenCalledTimes(1);
        expect(subscription2).toHaveBeenLastCalledWith(expected);
      });
    });
  });

  describe('useProxyState', () => {
    it('should create a subscribed state and retrigger for changes', () => {
      const initialState = {};
      const { result } = renderHook(() => useProxyState(initialState));
      expect(result.current[0]).toHaveProperty('_proxy.subscribe');
      expect(result.current[0]).toHaveProperty('_proxy.watch');
      initialState['foo'] = 'bar';
      expect(result.current[0]).toHaveProperty('foo');
      expect(result.current[0]['foo']).toBe('bar');
    });
  });
});
