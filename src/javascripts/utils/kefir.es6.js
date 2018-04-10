import * as Kefir from 'kefir';
import {noop, zipObject} from 'lodash';
import {makeSum} from 'sum-types';

/**
 * @ngdoc service
 * @name utils/kefir
 * @description
 * Exports all functions from the 'kefir' node module plus additional
 * helpers.
 */
export * from 'kefir';


export const PromiseStatus = makeSum({
  Pending: ['value'],
  Resolved: ['value'],
  Rejected: ['error']
});


/**
 * @ngdoc method
 * @name utils/kefir#createStreamBus
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
 *
 * @param {Scope?} scope
 * @returns {utils/kefir.Bus}
 */
export function createStreamBus (scope) {
  let currentEmitter;

  const stream = Kefir.stream(function (emitter) {
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
    error
  };

  function emit (value) {
    currentEmitter.emit(value);
  }

  function error (value) {
    currentEmitter.error(value);
  }

  function end () {
    currentEmitter.end();
  }
}
// Deprecated alias
export {createStreamBus as createBus};


/**
 * @ngdoc method
 * @name utils/kefir#createPropertyBus
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
 *
 * @param {any} initialValue
 * @param {Scope?} scope
 * @returns {utils/kefir.PropertyBus}
 */
export function createPropertyBus (initialValue, scope) {
  const streamBus = createStreamBus(scope);

  const property = streamBus.stream.toProperty();

  // We activate the property so that we can start setting its value
  property.onValue(noop);
  streamBus.emit(initialValue);

  return {
    property: property,
    end: streamBus.end,
    set: streamBus.emit
  };
}


/**
 * @ngdoc method
 * @name utils/kefir#onValueScope
 * @description
 * `K.onValueScope(scope, stream, cb)` is like to
 * `K.onValue(stream, cb)` but bound to the the lifetime of the
 * scope.
 *
 * In particular:
 * - The callback is detached from the stream when the scope is
 *   destroyed
 * - `scope.$applyAsync()` is called after each time the value changes
 *
 * @param {Scope} scope
 * @param {Observable} observable
 * @param {function} cb
 *
 * @returns {function}
 *   Call this function to detach the callback
 */
export function onValueScope (scope, stream, cb) {
  const lifeline = scopeLifeline(scope);
  const off = onValueWhile(lifeline, stream, function (value) {
    cb(value);
    scope.$applyAsync();
  });
  return off;
}


/**
 * @ngdoc method
 * @name utils/kefir#onValue
 * @description
 * `K.onValue(stream, cb)` is similar to `stream.onValue(cb)` but the
 * former returns a function that, when called, removes the listener.
 *
 * @param {Observable} observable
 * @param {function} cb
 *
 * @returns {function}
 *   Call this function to detach the callback
 */
export function onValue (stream, cb) {
  stream.onValue(cb);

  return function off () {
    if (stream) {
      stream.offValue(cb);
      stream = cb = null;
    }
  };
}

/**
 * @ngdoc method
 * @name utils/kefir#onValueWhile
 * @description
 * Similar to `K.onValue(observable, cb)` but detaches the callback
 * when the lifeline stream argument ends.
 *
 * @param {Observable} lifeline
 * @param {Observable} observable
 * @param {function} cb
 *
 * @returns {function}
 *   Call this function to detach the callback
 */
export function onValueWhile (lifeline, stream, cb) {
  const off = onValue(stream, cb);
  lifeline.onEnd(off);
  return off;
}


/**
 * @ngdoc method
 * @name utils/kefir#fromScopeEvent
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
 * @param {Scope} scope
 * @param {string} event
 * @param {boolean} uncurry
 * If true, multiple arguments passed to an event will be turned into
 * an array value in the stream.
 */
export function fromScopeEvent (scope, event, uncurry) {
  return Kefir.stream(function (emitter) {
    const offEvent = scope.$on(event, function () {
      let value;
      if (uncurry) {
        value = Array.prototype.slice.call(arguments, 1);
      } else {
        value = arguments[1];
      }
      emitter.emit(value);
    });

    const offDestroy = scope.$on('$destroy', function () {
      emitter.end();
    });

    return function () {
      offEvent();
      offDestroy();
    };
  });
}


/**
 * @ngdoc method
 * @name utils/kefir#fromScopeValue
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
export function fromScopeValue (scope, get) {
  const bus = createPropertyBus(get(scope));
  scope.$watch(get, bus.set);
  scope.$on('$destroy', bus.end);
  return bus.property;
}


/**
 * @ngdoc method
 * @name utils/kefir#sampleBy
 * @description
 * Create a property that is updated whenever the observable emits a
 * new event. The sampler function is used to obtain the value.
 *
 * @param {Observable<any>} obs
 * @param {function} sampler
 * @returns {Property<any>}
 */
export function sampleBy (obs, sampler) {
  // We need to pass `noop` to get an initial, undefined value.
  return obs.toProperty(noop).map(sampler);
}


/**
 * @ngdoc method
 * @name utils/kefir#promiseProperty
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
 *
 *
 * @param {Promise<T>} promise
 * @param {T?} pendingValue
 * @returns {Property<PromiseStatus<T>>}
 */
export function promiseProperty (promise, pendingValue) {
  const bus = createPropertyBus(PromiseStatus.Pending(pendingValue));
  promise.then(function (value) {
    bus.set(PromiseStatus.Resolved(value));
  }, function (error) {
    bus.set(PromiseStatus.Rejected(error));
  });
  return bus.property;
}


/**
 * @ngdoc method
 * @name utils/kefir#combineProperties
 * @description
 * Similar to [Kefir.combine](kefir-combine) but returns a property
 * instead of a stream.
 *
 * Throws an error if one of the arguments is not a Kefir property.
 *
 * [kefir-combine]: https://rpominov.github.io/kefir/#combine
 *
 * @param {Kefir.Property[]} props
 * @param {function(): T} combinator
 * @returns {Property<T>}
 */
export function combineProperties (props, combinator) {
  props.forEach(assertIsProperty);
  return Kefir.combine(props, combinator).toProperty(function () {});
}


/**
 * @ngdoc method
 * @name utils/kefir#combinePropertiesObject
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
 *
 * @param {object} props
 * @returns {Property<object>}
 */
export function combinePropertiesObject (props) {
  const keys = Object.keys(props);
  const values$ = keys.map((k) => {
    const prop = props[k];
    assertIsProperty(prop);
    return prop;
  });
  return combineProperties(values$)
    .map((values) => zipObject(keys, values));
}


/**
 * @ngdoc method
 * @name utils/kefir#holdWhen
 * @description
 * Takes a property and a predicate and returns a property that has the
 * same values as the initial property until the current value
 * satisfies the predicate. After that the property is constant with
 * that value.
 *
 * @param {Kefir.Property<T>} props
 * @param {function(T): boolean} predicate
 * @returns {Kefir.Property<T>}
 */
export function holdWhen (prop, predicate) {
  assertIsProperty(prop);
  let hold = false;
  return prop.withHandler((emitter, event) => {
    if (hold) {
      return;
    }

    if (event.type === 'error') {
      throw new Error(event.value);
    } else if (event.type === 'end') {
      emitter.end();
    } else if (event.type === 'value') {
      emitter.value(event.value);
      if (predicate(event.value)) {
        hold = true;
        prop = null;
        emitter.end();
      }
    }
  });
}


/**
 * @ngdoc method
 * @name utils/kefir#getValue
 * @description
 * Gets the current value of a property and throws an error if the
 * property does not have a value.
 *
 * WARNING: Use this sparsely. Using this leads to un-idomatic code
 *
 * @param {Kefir.Property<T>} props
 * @returns {T}
 */
export function getValue (prop) {
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
 * Returns a reference object to the current value of the property.
 *
 * ~~~js
 * const ref = K.getRef(prop)
 * ref.value // => current value
 * ref.dispose() // => unsubcribes once and for all
 * ~~~
 *
 * The function subscribes to the property immediately and sets the
 * `value` property of the reference object.
 *
 * The reference object also has a `dispose()` function that
 * unsubscribes from the property. In addition it cleans up the
 * reference deleting both the `value` and `dispose` properties.
 */
export function getRef (prop) {
  assertIsProperty(prop);
  const ref = {dispose};

  const unsub = onValue(prop, (value) => { ref.value = value; });
  return ref;

  function dispose () {
    unsub();
    delete ref.value;
    delete ref.dispose;
  }
}


/**
 * @ngdoc method
 * @name utils/kefir#scopeLifeline
 * @description
 * Returns a stream that ends when the scope is destroyed.
 * @params {Scope} scope
 * @returns {Kefir.Stream<void>}
 */
export function scopeLifeline (scope) {
  return Kefir.stream((emitter) => {
    if (!scope || scope.$$destroyed) {
      return end();
    } else {
      return scope.$on('$destroy', end);
    }

    function end () {
      scope = null;
      emitter.end();
      return noop;
    }
  });
}


/**
 * @ngdoc method
 * @name utils/kefir#endWith
 * @description
 * Returns a property that ends when
 *
 * This starts listening on both the `prop` and `lifeline` observables.
 *
 * @params {Kefir.Property<T>} prop
 * @params {Kefir.Stream<any>} lifeline
 * @returns {Kefir.Property<T>}
 */
export function endWith (prop, lifeline) {
  const bus = createPropertyBus();

  const propSub = prop.observe({
    value: bus.set,
    end: end
  });

  const lifelineSub = lifeline.observe({end});

  return bus.property;

  function end () {
    bus.end();
    propSub.unsubscribe();
    lifelineSub.unsubscribe();
  }
}

function assertIsProperty (prop) {
  if (
    !prop ||
    typeof prop.getType !== 'function' ||
    prop.getType() !== 'property'
  ) {
    throw new TypeError('Object values must be properties');
  }
}
