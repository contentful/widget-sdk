import * as Kefir from 'kefir';
import { noop, zipObject } from 'lodash';
import { makeSum } from 'sum-types';
import type { Emitter, Observable, Stream, Property } from 'kefir';
import { useEffect, useRef } from 'react';

export * from 'kefir';

interface Bus {
  end: () => void;
  error: (e: unknown) => void;
}

export interface StreamBus<T> extends Bus {
  stream: Stream<T, unknown>;
  emit: (value: T) => void;
}

export interface PropertyBus<T> extends Bus {
  property: Property<T, unknown>;
  set: (value: T) => void;
}

type Handler = (value: unknown) => void;
type Off = () => void;
type Scope = {
  $applyAsync: () => void;
  $on: (event: string, cb: () => void) => Off;
  $watch: (watch: Function, cb: Handler) => void;
  $$destroyed: boolean;
};

export const PromiseStatus = makeSum({
  Pending: ['value'],
  Resolved: ['value'],
  Rejected: ['error'],
});

/**
 * @usage[js]
 * var bus = K.createStreamBus(scope)
 * bus.stream.onValue(cb)
 * bus.emit('VAL')
 * // 'cb' is called with 'VAL'
 * bus.end()
 * // or
 * scope.$destroy()
 *
 * @description
 * Create a bus that allows us to push values onto a Kefir stream.
 *
 * If the scope parameter is given the stream ends when the scope is
 * destroyed.
 */
export function createStreamBus<T>(scope?: Scope): StreamBus<T> {
  let currentEmitter: Emitter<T, unknown>;
  const stream = Kefir.stream<T, unknown>((emitter) => {
    currentEmitter = emitter;
  });

  // We activate the stream so that `currentEmitter` gets assigned.
  stream.onValue(noop);
  if (scope) {
    scope.$on('$destroy', end);
  }

  return {
    stream,
    end,
    emit,
    error,
  };

  function emit(value) {
    currentEmitter.emit(value);
  }

  function error(value) {
    currentEmitter.error(value);
  }

  function end() {
    currentEmitter.end();
  }
}

// Deprecated alias
export { createStreamBus as createBus };

/**
 * @usage[js]
 * var bus = K.createPropertyBus('INITIAL', scope)
 * bus.property.onValue(cb1)
 * // 'cb1' is called with 'INITIAL'
 * bus.set('VAL')
 * bus.property.onValue(cb2)
 * // 'cb2' is called with 'VAL'
 * bus.end()
 * // or
 * scope.$destroy()
 *
 * @description
 * Create a bus that allows us to imperatively set the value of a
 * Kefir property.
 *
 * If the scope parameter is given the stream ends when the scope is
 * destroyed.
 */
export function createPropertyBus<T>(initialValue: T, scope?: Scope): PropertyBus<T> {
  const streamBus = createStreamBus<T>(scope);
  const property = streamBus.stream.toProperty();

  // We activate the property so that we can start setting its value
  property.onValue(noop);
  streamBus.emit(initialValue);

  return {
    property,
    end: streamBus.end,
    set: streamBus.emit,
    error: streamBus.error,
  };
}

/**
 * @description
 * `K.onValueScope(scope, stream, cb)` is like to
 * `K.onValue(stream, cb)` but bound to the the lifetime of the
 * scope.
 *
 * In particular:
 * - The callback is detached from the stream when the scope is
 *   destroyed
 * - `scope.$applyAsync()` is called after each time the value changes
 */
export function onValueScope(scope: Scope, stream: Observable<unknown, unknown>, cb: Handler): Off {
  const lifeline = scopeLifeline(scope);

  return onValueWhile(lifeline, stream, (value) => {
    cb(value);
    scope.$applyAsync();
  });
}

/**
 * @description
 * `K.onValue(stream, cb)` is similar to `stream.onValue(cb)` but the
 * former returns a function that, when called, removes the listener.
 */
export function onValue(stream: Observable<unknown, unknown>, cb: Handler): Off {
  const subscription = stream.observe(cb);
  return subscription.unsubscribe;
}

/**
 * @description
 * Similar to `K.onValue(observable, cb)` but detaches the callback
 * when the lifeline stream argument ends.
 */
export function onValueWhile(
  lifeline: Observable<unknown, unknown>,
  stream: Observable<unknown, unknown>,
  cb: Handler
): Off {
  const off = onValue(stream, cb);
  lifeline.onEnd(off);
  return off;
}

/**
 * @description
 * Create a stream of events emitted on the scope.
 *
 * The stream ends once the scope is destroyed.
 *
 * @usage[js]
 * var stream = K.fromScopeEvent(scope, 'myEvent');
 * stream.onValue((x) => console.log(x))
 * scope.$emit('myEvent', 'value')
 * // => 'value' is logged
 *
 * If true, multiple arguments passed to an event will be turned into
 * an array value in the stream.
 */
export function fromScopeEvent(
  scope: Scope,
  event: string,
  uncurry?: boolean
): Stream<unknown, unknown> {
  return Kefir.stream((emitter) => {
    const offEvent = scope.$on(event, function (...args: unknown[]) {
      let value;
      if (uncurry) {
        value = Array.prototype.slice.call(args, 1);
      } else {
        value = args[1];
      }
      emitter.emit(value);
    });

    const offDestroy = scope.$on('$destroy', () => {
      emitter.end();
    });

    return () => {
      offEvent();
      offDestroy();
    };
  });
}

/**
 * @description
 * Create a property that is updated whenever the scope value changes.
 *
 * This installs a watcher on the scope that calls the `get` function to obtain
 * the value.
 *
 * @param {Scope} scope
 * @param {function(scope): T} get
 *   Function that takes the scope and returns the value
 * @returns {Property<T>}
 */
export function fromScopeValue<T>(scope: Scope, get): Property<T, unknown> {
  const bus = createPropertyBus(get(scope), scope);
  scope.$watch(get, bus.set);
  return bus.property;
}

/**
 * @description
 * Create a property that is updated whenever the observable emits a
 * new event. The sampler function is used to obtain the value.
 */
export function sampleBy<T>(obs, sampler: { (): T }): Property<T, unknown> {
  // We need to pass `noop` to get an initial, undefined value.
  return obs.toProperty(noop).map(sampler);
}

/**
 * @usage[js]
 * const prop = K.promiseProperty(promise, 'PENDING')
 * prop.onValue((p) => {
 *   caseof(p, [
 *     [K.PromiseStatus.Pending, ({value}) => console.log('pending', value)]
 *     [K.PromiseStatus.Resolved, ({value}) => console.log('sucess', value)]
 *     [K.PromiseStatus.Rejected, ({error}) => console.log('error', error)]
 *   ])
 * })
 *
 * @description
 * Create a property from a promise.
 *
 * The property value is of 'PromiseStatus' which is either
 * 'Pending', 'Resolved', or 'Rejected'.
 *
 * You can pass an optional value parameter that is assigned to the
 * 'Pending' constructor.
 */
export function promiseProperty(
  promise: Promise<unknown>,
  pendingValue?: unknown
): Property<unknown, unknown> {
  const bus = createPropertyBus(PromiseStatus.Pending(pendingValue));
  promise.then(
    (value) => {
      bus.set(PromiseStatus.Resolved(value));
    },
    (error) => {
      bus.set(PromiseStatus.Rejected(error));
    }
  );
  return bus.property;
}

/**
 * @description
 * Similar to [Kefir.combine](kefir-combine) but returns a property
 * instead of a stream.
 *
 * Throws an error if one of the arguments is not a Kefir property.
 *
 * [kefir-combine]: https://rpominov.github.io/kefir/#combine
 */
export function combineProperties<T>(
  props: Property<unknown, unknown>[],
  combinator: { (...values: unknown[]): T }
): Property<T, unknown> {
  props.forEach(assertIsProperty);
  return Kefir.combine(props, combinator).toProperty();
}

/**
 * @description
 * Combines an object with properties as values into a property with
 * objects as values.
 * ~~~js
 * combinePropertiesObject({
 *   a: K.constant('A'),
 *   b: K.constant('B'),
 * }).onValue((val) => {
 *   // val => {a: 'A', b: 'B'}
 * })
 * ~~~
 * The combined property is updated when any of the input properties
 * changes. The values from other properties are retained.
 */
export function combinePropertiesObject<T>(props: {
  [k: string]: Property<unknown, unknown>;
}): Property<T, unknown> {
  const keys = Object.keys(props);
  const values$ = keys.map((k) => {
    const prop = props[k];
    assertIsProperty(prop);
    return prop;
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return combineProperties<T>(values$).map((values) => zipObject(keys, values));
}

/**
 * Gets the current value of a property and throws an error if the
 * property does not have a value.
 *
 * WARNING: Use this sparsely. Using this leads to un-idomatic code
 */
export function getValue<T>(prop: Property<T, unknown>): T {
  let called = false;
  let value;
  const off = onValue(prop, (x) => {
    value = x;
    called = true;
  });

  off();
  if (!called) {
    throw new Error('Property does not have current value');
  }

  return value;
}

/**
 * Returns a stream that ends when the scope is destroyed.
 */
export function scopeLifeline(scope: Scope): Stream<void, unknown> {
  let watchScope: Scope | null = scope;
  return Kefir.stream((emitter) => {
    if (!watchScope || watchScope.$$destroyed) {
      return end();
    }
    return watchScope.$on('$destroy', end);

    function end() {
      watchScope = null;
      emitter.end();
      return noop;
    }
  });
}

/**
 * Returns a stream that ends when the component is unmounted.
 */
export const useLifeline = (): StreamBus<unknown> => {
  const { current: lifeline } = useRef(createStreamBus());
  useEffect(() => lifeline?.end, [lifeline]);
  return lifeline;
};

/**
 * Returns a property that ends when
 *
 * This starts listening on both the `prop` and `lifeline` observables.
 */
export function endWith<T>(
  prop: Property<T, unknown>,
  lifeline: Stream<unknown, unknown>
): Property<T, unknown> {
  return Kefir.stream<T, unknown>((emitter) => {
    const propSub = prop.observe({ value: emitter.emit, end });
    const lifelineSub = lifeline.observe({ end });

    function end() {
      emitter.end();
      propSub.unsubscribe();
      lifelineSub.unsubscribe();
    }
  }).toProperty();
}

function assertIsProperty(prop) {
  if (!prop || typeof prop.getType !== 'function' || prop.getType() !== 'property') {
    throw new TypeError('Object values must be properties');
  }
}
