'use strict';

angular.module('cf.utils')
/**
 * @ngdoc service
 * @name utils/kefir
 * @description
 * Exports all functions from the 'kefir' node module plus additional
 * helpers.
 */
.factory('utils/kefir', ['require', function (require) {
  var Kefir = require('libs/kefir');

  return _.assign({
    onValue: onValue,
    onValueScope: onValueScope,
    fromScopeEvent: fromScopeEvent,
    createBus: createBus
  }, Kefir);


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
  function createBus (scope) {
    var currentEmitter;

    var stream = Kefir.stream(function (emitter) {
      currentEmitter = emitter;
      return function () {
        currentEmitter = null;
      };
    });

    if (scope) {
      scope.$on('$destroy', end);
    }

    return {
      stream: stream,
      end: end,
      emit: emit
    };

    function emit (value) {
      if (currentEmitter) {
        currentEmitter.emit(value);
      }
    }

    function end () {
      if (currentEmitter) {
        currentEmitter.end();
        currentEmitter = null;
      }
    }
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
   * - The callback is wrapped in `scope.$applyAsync()`
   *
   * @param {Scope} scope
   * @param {Stream} stream
   * @param {function} cb
   *
   * @returns {function}
   *   Call this function to detach the callback
   */
  function onValueScope (scope, stream, cb) {
    var off = onValue(stream, function (value) {
      scope.$applyAsync(function () {
        cb(value);
      });
    });
    scope.$on('$destroy', off);
    return off;
  }


  /**
   * @ngdoc method
   * @name utils/kefir#onValue
   * @description
   * `K.onValue(stream, cb)` is similar to `stream.onValue(cb)` but the
   * former returns a function that, when called, removes the listener.
   *
   * @param {Stream} stream
   * @param {function} cb
   *
   * @returns {function}
   *   Call this function to detach the callback
   */
  function onValue (stream, cb) {
    stream.onValue(cb);

    return function off () {
      stream.offValue(cb);
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
  function fromScopeEvent (scope, event, uncurry) {
    return Kefir.stream(function (emitter) {
      var offEvent = scope.$on(event, function () {
        var value;
        if (uncurry) {
          value = Array.prototype.slice.call(arguments, 1);
        } else {
          value = arguments[1];
        }
        emitter.emit(value);
      });

      var offDestroy = scope.$on('$destroy', function () {
        emitter.end();
      });

      return function () {
        offEvent();
        offDestroy();
      };
    });
  }
}]);
