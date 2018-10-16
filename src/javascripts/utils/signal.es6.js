import _ from 'lodash';

/**
 * var signal = require('utils/signal.es6').create()
 * var detach = signal.attach(function (message) {
 *   console.log('Simon says: ' + message)
 * })
 * signal.dispatch('Hello')
 * detach();
 * @description
 * You can also create signals that memoize their most recently
 * dispatched value.
 *
 * ~~~js
 * var createMemoized = require('utils/signal.es6').createMemoized
 * var signal = createSignal('initial')
 * signal.attach(function (v) {
 *   console.log(v)
 * });
 * // logs 'initial' immediately
 * signal.dispatch('value')
 * signal.attach(function (v) {
 *   console.log(v)
 * });
 * // logs 'value' immediately
 * ~~~
 */

/**
 * @returns {Signal}
 */
export function create() {
  const listeners = {};
  let nextId = 0;

  return {
    _listeners: listeners,

    dispatch: function() {
      const args = arguments;
      _.forEach(listeners, listener => {
        listener(...args);
      });
    },

    attach: function(listener) {
      // eslint-disable-next-line
      const id = nextId++;
      listeners[id] = listener;

      return function removeListener() {
        delete listeners[id];
      };
    }
  };
}

/**
 * @returns {Signal}
 */
export function createMemoized(...args) {
  let lastArgs = args;

  const baseSignal = create();

  return {
    dispatch: function(...args) {
      lastArgs = args;
      baseSignal.dispatch.apply(null, args);
    },

    attach: function(listener) {
      listener(...lastArgs);
      return baseSignal.attach(listener);
    }
  };
}
