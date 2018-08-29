'use strict';

angular
  .module('contentful')

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
  .factory('widgets/channel', [
    'require',
    require => {
      var $window = require('$window');
      var $q = require('$q');
      var random = require('random');
      var $rootScope = require('$rootScope');

      /**
       * @ngdoc type
       * @name Channel
       */

      /**
       * @ngdoc property
       * @name Channel#handlers
       * @type {[id:string]: function}
       */
      function Channel(iframe) {
        this.iframe = iframe;
        this.id = random.id();
        this.handlers = {};
        this.messageQueue = [];

        var self = this;
        this.messageListener = ev => {
          $rootScope.$apply(() => {
            var data = ev.data;
            if (data.source === self.id) {
              self._dispatch(data.method, data.id, data.params);
            }
          });
        };

        $window.addEventListener('message', this.messageListener);
      }

      /**
       * @ngdoc method
       * @name Channel#send
       * @description
       * Calls `postMessage` on the iframes content window.
       *
       * The message looks like
       * ~~~
       * { method: method, params: params }
       * ~~~
       *
       * If the channel has not yet been connected the message will be
       * pushed onto a queue and will be sent after calling `#connect()`.
       *
       * @param {string} message
       * @param {Array<any>} params
       */
      Channel.prototype.send = function(message, params) {
        if (!Array.isArray(params)) {
          throw new Error('`params` is expected to be an array');
        }
        if (this.connected) {
          this._send(message, params);
        } else {
          this.messageQueue.push({ method: message, params: params });
        }
      };

      Channel.prototype.connect = function(data) {
        if (this.connected) {
          throw new Error('Widget Channel already connected');
        }
        this.connected = true;
        var params = [_.extend({ id: this.id }, data), this.messageQueue];
        this._send('connect', params);
      };

      Channel.prototype._dispatch = function(method, callId, args) {
        var handler = this.handlers[method];
        var self = this;

        if (handler) {
          // TODO catch synchronous errors
          var result = handler(...args);
          if (typeof result !== 'undefined') {
            $q.resolve(result).then(respondResult, respondError);
          }
        }

        function respondResult(result) {
          self._respondSuccess(callId, result);
        }

        function respondError(error) {
          self._respondError(callId, error);
        }
      };

      Channel.prototype.destroy = function() {
        this.destroyed = true;
        this.iframe = null;
        $window.removeEventListener('message', this.messageListener);
      };

      Channel.prototype._send = function(method, params) {
        this.iframe.contentWindow.postMessage(
          {
            method: method,
            params: params
          },
          '*'
        );
      };

      Channel.prototype._respondSuccess = function(id, result) {
        if (this.destroyed) {
          return;
        }

        this.iframe.contentWindow.postMessage(
          {
            id: id,
            result: result
          },
          '*'
        );
      };

      Channel.prototype._respondError = function(id, error) {
        if (this.destroyed) {
          return;
        }

        if (!this.iframe || !this.iframe.contentWindow) {
          return;
        }

        this.iframe.contentWindow.postMessage(
          {
            id: id,
            error: {
              code: error.code || error.name,
              message: error.message,
              data: error.data
            }
          },
          '*'
        );
      };

      return Channel;
    }
  ]);
