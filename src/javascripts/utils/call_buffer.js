'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name utils/CallBuffer
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
.factory('utils/CallBuffer', [() => {
  var OPEN = 'open';
  var RESOLVED = 'resolved';
  var DISABLED = 'disabled';

  return {create: create};

  function create () {
    var calls = [];
    var state = OPEN;
    var service = null;

    return {
      call: call,
      resolve: resolve,
      disable: disable
    };

    /**
     * @ngdoc method
     * @name utils/CallBuffer#call
     * @param {function} fn
     * @description
     * Depending on state, executes the function
     * or records it to execute in the future.
     * The function is called with a service
     * passed to `resolve`
     */
    function call (fn) {
      if (state === RESOLVED) {
        fn(service);
      } else if (state === OPEN) {
        calls.push(fn);
      }
    }

    /**
     * @ngdoc method
     * @name utils/CallBuffer#resolve
     * @param {any?} _service
     * @description
     * Executes recorded calls and marks buffer
     * as resolved.
     */
    function resolve (_service) {
      if (state === OPEN) {
        state = RESOLVED;
        service = _service;
        calls.forEach(fn => {
          fn(service);
        });
        calls = [];
      }
    }

    /**
     * @ngdoc method
     * @name utils/CallBuffer#disable
     * @description
     * Discards all recorded calls and marks
     * buffer as disabled.
     */
    function disable () {
      state = DISABLED;
      calls = [];
    }
  }
}]);
