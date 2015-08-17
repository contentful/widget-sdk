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
 */
.factory('signal', [function () {

  return function createSignal () {
    var listeners = {};
    var nextId = 0;
    return {
      _listeners: listeners,

      dispatch: function () {
        var args = arguments;
        _.forEach(listeners, function (listener) {
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
  };

}]);
