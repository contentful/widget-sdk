'use strict';

angular.module('cf.utils')
/**
 * @ngdoc service
 * @module cf.utils
 * @name signal
 * @usage[js]
 * var signal = require('signal').create()
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
 * var createMemoized = require('signal').createMemoized
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
.factory('signal', [() => {
  return {
    create: create,
    createMemoized: createMemoized
  };

  /**
   * @ngdoc method
   * @name signal#create
   * @returns {Signal}
   */
  function create () {
    var listeners = {};
    var nextId = 0;

    return {
      _listeners: listeners,

      dispatch: function () {
        var args = arguments;
        _.forEach(listeners, listener => {
          listener.apply(null, args);
        });
      },

      attach: function (listener) {
        var id = nextId++;
        listeners[id] = listener;

        return function removeListener () {
          delete listeners[id];
        };
      }
    };
  }

  /**
   * @ngdoc method
   * @name signal#createMemoized
   * @returns {Signal}
   */
  function createMemoized () {
    var lastArgs = arguments;

    var baseSignal = create();

    return {
      dispatch: function () {
        lastArgs = arguments;
        baseSignal.dispatch.apply(null, arguments);
      },

      attach: function (listener) {
        listener.apply(null, lastArgs);
        return baseSignal.attach(listener);
      }
    };
  }
}]);
