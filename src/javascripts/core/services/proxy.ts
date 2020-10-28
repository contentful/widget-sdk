export type WatchFunction<T> = (args: {
  target: T;
  key: T extends {} ? keyof T : T extends [] ? number : symbol;
  value: unknown;
}) => void;

type UnsubscribeFunction = () => boolean;
type SubscribeFunction<T> = (watchFn: WatchFunction<T>) => UnsubscribeFunction;

export type Proxy<T extends {}> = T & {
  _proxy: { subscribe: SubscribeFunction<T> };
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
  const subscriptions: WatchFunction<T>[] = [];
  const subscribe: SubscribeFunction<T> = (watchFn: WatchFunction<T>) => {
    const count = subscriptions.push(watchFn);
    return () => {
      subscriptions.splice(count - 1, 1);
      return true;
    };
  };

  const broadcast = (args) =>
    subscriptions.forEach(
      (subscription) => subscription && typeof subscription === 'function' && subscription(args)
    );

  const handler: ProxyHandler<any> = {
    set: (target, key, value, receiver) => {
      const reflection = Reflect.set(target, key, value, receiver);
      broadcast({ target, key, value });
      return reflection;
    },
  };
  return new Proxy(Object.assign(object, { _proxy: { subscribe } }), handler);
}
