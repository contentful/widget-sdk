'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name CallBuffer
 * @description
 * A service that records function calls while in the initial
 * open state. When the buffer is resolved, buffered computations
 * are executed.
 *
 * Afterwards, subsequent computations are executed immediately
 * and synchronously.
 *
 * Instead of resolving the buffer can also be disabled. That
 * discards all buffered function calls. Future calls are discarded
 * immediately.
 *
 * After being resolved or disabled, the buffer can not be
 * transitioned into another state anymore.
 */
.factory('CallBuffer', [function () {
  var OPEN = 'open';
  var RESOLVED = 'resolved';
  var DISABLED = 'disabled';

  return {create: create};

  function create () {
    var calls = [];
    var state = OPEN;

    return {
      call: call,
      resolve: resolve,
      disable: disable
    };

    function call (fn) {
      if (state === RESOLVED) {
        fn();
      } else if (state !== DISABLED) {
        calls.push(fn);
      }
    }

    function resolve () {
      if (state === OPEN) {
        state = RESOLVED;
        calls.forEach(function (fn) {
          fn();
        });
        calls = [];
      }
    }

    function disable () {
      state = DISABLED;
      calls = [];
    }
  }
}]);
