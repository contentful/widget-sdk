import { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';

type Broadcast<T> = {
  target: Proxy<T>;
  key: ObjectOrArrayKey<T>;
  value: unknown;
};

type Subscription<T> = WatchFunction<T> | { keys: ObjectOrArrayKey<T>[]; watch: WatchFunction<T> };

type UnsubscribeFunction = () => boolean;
type SubscribeFunction<T> = (watch: WatchFunction<T>) => UnsubscribeFunction;
type WatchKeysFunction<T> = (
  keys: ObjectOrArrayKey<T>[],
  watch: WatchFunction<T>
) => UnsubscribeFunction;

export type WatchFunction<T> = (args: Broadcast<T>) => void;
export type ObjectOrArrayKey<T> = T extends [] ? number : T extends {} ? keyof T : symbol;
export type Proxy<T extends {}> = T & {
  _proxy: {
    subscribe: SubscribeFunction<T>;
    watch: WatchKeysFunction<T>;
  };
};

/**
 * Wraps an array or object with a proxy, adding a '_proxy' property with 'subscribe' function
 *
 * IMPORTANT: The subscribe function does not listen to nested properties in the current implementation
 *
 * @param {object|array<any>} object
 * @returns {Proxy<object|array<any>>}
 */
export function proxify<T>(object: T): Proxy<T> {
  const subscriptions: Subscription<T>[] = [];
  const addSubscription = (subscription: Subscription<T>) => {
    const count = subscriptions.push(subscription);
    return () => {
      const deleted = subscriptions.splice(count - 1, 1);
      return deleted.length > 0;
    };
  };

  const subscribe: SubscribeFunction<T> = (watch) => addSubscription(watch);
  const watch: WatchKeysFunction<T> = (keys, watch) => addSubscription({ keys, watch });

  const broadcast = (args: Broadcast<T>) => {
    subscriptions.forEach((subscription) => {
      if (typeof subscription === 'function') {
        subscription(args);
      } else if (
        typeof subscription?.watch === 'function' &&
        subscription?.keys?.map(String).includes(args.key as string)
      ) {
        subscription.watch(args);
      }
    });
  };

  const getProxy = (object: T) => {
    const handler: ProxyHandler<any> = {
      set: (target, key: ObjectOrArrayKey<T>, value, receiver) => {
        const reflection = Reflect.set(target, key, value, receiver);
        broadcast({ target: getProxy(target), key, value });
        return reflection;
      },
    };

    return new Proxy(
      Object.assign(object, {
        _proxy: {
          subscribe,
          watch,
        },
      }),
      handler
    );
  };

  return getProxy(object);
}

/**
 * Wraps a proxy into React state, updating the state on property changes
 *
 * @param {object|array<any>} object
 */
export const useProxyState = <T>(
  initialState: T
): [Proxy<T>, Dispatch<SetStateAction<Proxy<T>>>] => {
  const { current } = useRef(proxify(initialState));
  const [state, setState] = useState(current);
  useEffect(() => {
    const unsubscribe = current._proxy.subscribe(({ target }) => {
      setState(target);
    });
    return () => {
      unsubscribe();
    };
  }, [current]);

  return [state, setState];
};
