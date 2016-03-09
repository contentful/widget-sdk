'use strict';

angular.module('cf.utils')
/**
 * @ngdoc service
 * @module cf.utils
 * @name signal
 * @usage[js]
 * var signal = $injector.get('signal')()
 * var detach = signal.attach(function (message) {
 *   console.log('Simon says: ' + message)
 * })
 * signal.dispatch('Hello')
 * detach();
 * @description
 * Signals also memoize their most recently dispatched value. This
 * allows you to trigger a listener immediately after it is attached by
 * passing `true` as the second argument.
 * ~~~js
 * signal.dispatch('value')
 * signal.attach(function (v) {
 *   console.log(v)
 * }, true);
 * // logs 'value' immediately
 * ~~~
 *
 * You can pass an initial value when creating a signal. This value is
 * only sent to listeners that attach with the `true` flag and is
 * overwritten by subsequent calls to `.dispatch()`.
 *
 * ~~~js
 * var createSignal = $injector.get('signal')
 * var signal = createSignal('initial')
 * signal.attach(function (v) {
 *   console.log(v)
 * }, true);
 * // logs 'initial' immediately
 * ~~~
 */
.factory('signal', [function () {

  return function createSignal () {
    var listeners = {};
    var nextId = 0;
    var lastArgs = arguments;

    return {
      _listeners: listeners,

      dispatch: function () {
        lastArgs = arguments;
        _.forEach(listeners, function (listener) {
          listener.apply(null, lastArgs);
        });
      },

      attach: function (listener, sendLast) {
        var id = nextId++;
        listeners[id] = listener;

        if (sendLast) {
          listener.apply(null, lastArgs);
        }
        return function removeListener () {
          delete listeners[id];
        };
      }
    };
  };

}]);
