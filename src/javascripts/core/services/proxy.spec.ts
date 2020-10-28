import { proxify } from './proxy';

describe('proxy', () => {
  describe('array', () => {
    it('should be able to wrap an array', () => {
      const proxy = proxify([]);
      expect(Array.isArray(proxy)).toBe(true);
      expect(typeof proxy).toBe('object');
      expect(proxy).toHaveProperty('_proxy.subscribe');
    });

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

  describe('object', () => {
    it('should be able to wrap an object', () => {
      const proxy = proxify({});
      expect(Array.isArray(proxy)).toBe(false);
      expect(typeof proxy).toBe('object');
      expect(proxy).toHaveProperty('_proxy.subscribe');
    });

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
      const target: string[] = [];
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
});
