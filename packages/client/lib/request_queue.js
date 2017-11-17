'use strict';

var _ = require('lodash-node/modern');
var P = require('../vendor/promiscuous');

var RETRY_TIMEOUT = 1000;
var LIMIT_PER_SECOND = 10;
var SLOT_RESPAWN = 4 * 1000 / LIMIT_PER_SECOND;
var TOO_MANY_REQUESTS = 429;
var INFLIGHT = 'inflight';
var FULFILLED = 'fulfilled';
var THROTTLED = 'throttled';
var ERRORED = 'errored';

function RequestQueue () {
  this._pending = [];
  this._inflight = [];
  this._reset();
}

RequestQueue.prototype.push = function (call) {
  var self = this;
  var promise = new P(function (resolve, reject) {
    self._pending.push({
      call: call,
      resolve: resolve,
      reject: reject,
      status: null
    });
  });
  this._proceed();
  return promise;
};

RequestQueue.prototype._proceed = function () {
  this._removeFulfilled();
  this._removeThrottled();
  this._startPending();
};

RequestQueue.prototype._removeFulfilled = function () {
  _.remove(this._inflight, {status: FULFILLED});
};

RequestQueue.prototype._removeThrottled = function () {
  var throttled = _.remove(this._inflight, {status: THROTTLED});
  if (throttled.length > 0) this._retry(throttled);
};

RequestQueue.prototype._retry = function (requests) {
  var self = this;
  this._pending.unshift.apply(this._pending, requests);
  this._retryTimeout = setTimeout(function () {
    self._reset();
    self._proceed();
  }, RETRY_TIMEOUT);
  self._numSlots = 0;
};


RequestQueue.prototype._startPending = function () {
  var self = this;
  var startRequests = Math.min(this._numSlots, this._pending.length);

  _.times(startRequests, function () {
    var request = self._pending.shift();
    request.status = INFLIGHT;
    try {
      request.call()
        .then(successHandler, errorHandler);
    } catch (e) {
      // when the synchronous call() fails
      // should never happen unless _performRequest throws
      // TODO not quite happy with this. I want this to appear in the
      //     console with the original stacktrace (call to adapter.request)
      request.status = ERRORED;
      request.reject(e);
      return;
    }
    self._takeSlot();
    self._inflight.push(request);

    function successHandler (result) {
      request.status = FULFILLED;
      request.resolve(result);
      self._proceed();
    }

    function errorHandler (error) {
      if (error && error.statusCode === TOO_MANY_REQUESTS) {
        request.status = THROTTLED;
      } else {
        request.status = FULFILLED;
        request.reject(error);
      }
      self._proceed();
    }
  });
};

RequestQueue.prototype._takeSlot = function () {
  if (this._numSlots > 0) {
    this._numSlots--;
    setTimeout(respawnSlot, SLOT_RESPAWN);
  } else {
    throw new Error('No slots available');
  }

  var self = this;
  function respawnSlot () {
    if (self._isWaitingForRetry()) return;
    if (self._numSlots < LIMIT_PER_SECOND) {
      self._numSlots++;
      self._proceed();
    }
  }
};

RequestQueue.prototype._reset = function () {
  this._numSlots = LIMIT_PER_SECOND;
  this._retryTimeout = null;
};


RequestQueue.prototype._isWaitingForRetry = function () {
  return this._retryTimeout !== null && this._retryTimeout !== undefined;
};

module.exports = RequestQueue;
