'use strict';

angular.module('contentful')
.factory('client', ['$injector', function ($injector) {

  var $http = $injector.get('$http');
  var $q = $injector.get('$q');
  var environment = $injector.get('environment');
  var createRequestQueue = $injector.get('client/requestQueue');
  var Client = $injector.get('libs/@contentful/client').Client;

  var baseUrl = null;
  var defaultHeaders = null;
  var queuedRequestFn = createRequestQueue(request);

  return _.extend(new Client({request: queuedRequestFn}), {
    init: init,
    request: queuedRequestFn
  });

  function init (token) {
    baseUrl = '//' + environment.settings.api_host;
    defaultHeaders = {
      'X-Contentful-Skip-Transformation': true,
      // @todo content_api's preflight middleware has to accept this header first
      // 'X-Contentful-UI-Version': window.CF_UI_VERSION || 'development',
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      Authorization: 'Bearer ' + token
    };
  }

  function request (req) {
    if (!baseUrl || !defaultHeaders) {
      throw new Error('Call #init(token) first!');
    }

    return performRequest(buildRequest(req));
  }

  function buildRequest (data) {
    var req = {
      method: data.method,
      url: [baseUrl, data.path.replace(/^\/+/, '')].join('/'),
      headers: _.extend({}, defaultHeaders, data.headers)
    };

    var payloadProperty = data.method === 'GET' ? 'params' : 'data';
    req[payloadProperty] = data.payload;

    return req;
  }

  function performRequest (req) {
    return $http(req)
    .then(function (res) {
      return res.data;
    }, function (res) {
      return $q.reject({
        statusCode: parseInt(res.status, 10),
        body: res.data,
        request: req
      });
    });
  }

}])

.factory('client/requestQueue', ['$injector', function ($injector) {

  var $q = $injector.get('$q');
  var $timeout = $injector.get('$timeout');
  var moment = $injector.get('moment');

  var CALLS_IN_PERIOD = 7;
  var PERIOD = 1000;
  var DEFAULT_TTL = 5;
  var RATE_LIMIT_EXCEEDED = 429;

  return function createRequestQueue (requestFn) {

    var inFlight = 0;
    var queue = [];

    function shift () {
      if (inFlight >= CALLS_IN_PERIOD || queue.length < 1) {
        return;
      }

      var start = now();
      var call = queue.shift();
      inFlight += 1;

      $timeout(call.wait)
      .then(doCall)
      .then(handleSuccess, handleError)
      .then(completePeriod)
      .then(finalize);

      function doCall () {
        return requestFn.apply(null, call.args);
      }

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

      function backOff (call) {
        call.ttl -= 1;
        var attempt = DEFAULT_TTL - call.ttl;
        call.wait = Math.pow(2, attempt) * PERIOD;
        return call;
      }

      function completePeriod () {
        var duration = now() - start;
        if (duration < PERIOD) {
          return $timeout(PERIOD - duration);
        }
      }

      function finalize () {
        inFlight -= 1;
        shift();
      }
    }

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
  };

  function now () {
    return moment().valueOf();
  }

}]);
