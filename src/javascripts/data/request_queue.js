'use strict';

angular.module('cf.data')
.factory('data/requestQueue', ['require', function (require) {
  var $q = require('$q');
  var $timeout = require('$timeout');
  var moment = require('moment');

  var CALLS_IN_PERIOD = 7;
  var PERIOD = 1000;
  var DEFAULT_TTL = 5;
  var RATE_LIMIT_EXCEEDED = 429;

  return {create: createRequestQueue};

  function createRequestQueue (requestFn) {

    var inFlight = 0;
    var queue = [];

    return function push () {
      var deferred = $q.defer();

      queue.push({
        deferred: deferred,
        args: Array.prototype.slice.call(arguments),
        ttl: DEFAULT_TTL,
        wait: 0
      });
      shift();

      return deferred.promise;
    };

    function shift () {
      if (inFlight >= CALLS_IN_PERIOD || queue.length < 1) {
        return;
      }

      var start = now();
      var call = queue.shift();
      inFlight += 1;

      $timeout(call.wait)
      .then(function () {
        return requestFn.apply(null, call.args);
      })
      .then(handleSuccess, handleError)
      .then(completePeriod)
      .then(function () {
        inFlight -= 1;
        shift();
      });

      function handleSuccess (res) {
        call.deferred.resolve(res);
      }

      function handleError (err) {
        if (err.statusCode === RATE_LIMIT_EXCEEDED && call.ttl > 0) {
          queue.unshift(backOff(call));
        } else {
          call.deferred.reject(err);
        }
      }

      function completePeriod () {
        var duration = now() - start;
        if (duration < PERIOD) {
          return $timeout(PERIOD - duration);
        }
      }
    }
  }

  function backOff (call) {
    call.ttl -= 1;
    var attempt = DEFAULT_TTL - call.ttl;
    call.wait = Math.pow(2, attempt) * PERIOD;
    return call;
  }

  function now () {
    return moment().valueOf();
  }

}]);
