'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name widgets/channel
 * @description
 * This service exposes a `Channel` class that is used to communicate
 * with widgets in IFrames through `window.postMessage`.
 *
 * The communication protocol is based on [JSON-RPC v2.0][json-rpc].
 *
 * [json-rpc]: http://www.jsonrpc.org/specification
 */
.factory('widgets/channel', ['$injector', function ($injector) {
  var $window = $injector.get('$window');
  var $q = $injector.get('$q');
  var random = $injector.get('random');

  /**
   * @ngdoc type
   * @name Channel
   */
  function Channel (iframe) {
    this.iframe = iframe;
    this.id = random.id();
    this.handlers = {};
    this.messageQueue = [];

    var self = this;
    this.messageListener = function (ev) {
      var data = ev.data;
      if (data.source === self.id) {
        self._dispatch(data.method, data.id, data.params);
      }
    };

    $window.addEventListener('message', this.messageListener);
  }

  Channel.prototype.send = function (message, params) {
    if (this.connected) {
      this._send(message, params);
    } else {
      this.messageQueue.push([message, params]);
    }
  };

  Channel.prototype.connect = function (data) {
    if (this.connected) {
      throw new Error('Widget Channel already connected');
    }
    this.connected = true;
    this._send('connect', _.extend({id: this.id}, data));
    var self = this;
    _.forEach(this.messageQueue, function (args) {
      self._send.apply(self, args);
    });
  };

  Channel.prototype._dispatch = function (method, callId, args) {
    var handler = this.handlers[method];
    var self = this;

    if (handler) {
      // TODO catch synchronous errors
      var result = handler.apply(null, args);
      if (typeof result !== 'undefined') {
        $q.when(result).then(respondResult, respondError);
      }
    }

    function respondResult (result) {
      self._respondSuccess(callId, result);
    }

    function respondError (error) {
      self._respondError(callId, error);
    }
  };

  Channel.prototype.destroy = function () {
    $window.removeEventListener('message', this.messageListener);
  };


  Channel.prototype._send = function (method, params) {
    this.iframe.contentWindow.postMessage({
      method: method,
      params: params
    }, '*');
  };

  Channel.prototype._respondSuccess = function (id, result) {
    this.iframe.contentWindow.postMessage({
      id: id,
      result: result
    }, '*');
  };

  Channel.prototype._respondError = function (id, error) {
    this.iframe.contentWindow.postMessage({
      id: id,
      error: {
        code: error.code || error.name,
        message: error.message,
        data: error.data
      }
    }, '*');
  };

  return Channel;

}]);
