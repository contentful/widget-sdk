import * as Kefir from 'libs/kefir';
import {noop} from 'lodash';
import {makeSum} from 'libs/sum-types';


/**
 * @ngdoc service
 * @name utils/kefir
 * @description
 * Exports all functions from the 'kefir' node module plus additional
 * helpers.
 */
export * from 'libs/kefir';


export const PromiseStatus = makeSum({
  Pending: ['value'],
  Resolved: ['value'],
  Rejected: ['error']
});


/**
 * @ngdoc method
 * @name utils/kefir#createBus
 * @usage[js]
 * var bus = K.createBus(scope)
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
export function createBus (scope) {
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
    stream: stream,
    end: end,
    emit: emit
  };

  function emit (value) {
    currentEmitter.emit(value);
  }

  function end () {
    currentEmitter.end();
  }
}


/**
 * @ngdoc method
 * @name utils/kefir#createPropertyBus
 * @usage[js]
 * var bus = K.createPropertyBus('INITIAL', scope)
 * bus.stream.onValue(cb1)
 * // 'cb1' is called with 'INITIAL'
 * bus.set('VAL')
 * bus.stream.onValue(cb2)
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
  const streamBus = createBus(scope);

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
  const off = onValue(stream, function (value) {
    cb(value);
    scope.$applyAsync();
  });
  scope.$on('$destroy', function () {
    off();
    stream = cb = null;
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
  props.forEach(function (prop) {
    if (
      !prop ||
      typeof prop.getType !== 'function' ||
      prop.getType() !== 'property'
    ) {
      throw new TypeError('Value is not a Kefir property');
    }
  });

  return Kefir.combine(props, combinator).toProperty(function () {});
}
