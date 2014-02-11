'use strict';
angular.module('contentful').provider('ShareJS', function ShareJSProvider(environment) {
  var token;
  var url = '//'+environment.settings.ot_host+'/channel';

  this.token= function(e) {
    token = e;
  };

  this.url = function(e) {
    url = e;
  };

  this.$get = function(client, $rootScope) {
    function ShareJSClient(url, token) {
      this.token = token;
      this.url = url;
      this.connection = new window.sharejs.Connection(this.url, this.token);
      this.connection.socket.send = function (message) {
        // Monkey patch for better Angular compatiblity
        return this.sendMap({JSON: angular.toJson(message)});
      };
      this.connection.on('ok', stateChangeHandler);
      this.connection.on('error', stateChangeHandler);
      this.connection.on('disconnected', stateChangeHandler);
      this.connection.on('connect failed', stateChangeHandler);

      var oldState, c=this;
      function stateChangeHandler(error) {
        if (c.connection.state !== oldState) {
          $rootScope.$apply(function (scope) {
            scope.$broadcast('otConnectionStateChanged', c.connection.state, c.connection, error);
          });
          oldState = c.connection.state;
        }
      }
    }

    ShareJSClient.prototype = {
      _toKey: function toKey(sys) {
        var parts;
        if (sys.type === 'Space')
          parts = [sys.id, 'space'];
        else if (sys.type === 'ContentType')
          parts = [sys.space.sys.id, 'content_type', sys.id];
        else if (sys.type === 'Entry')
          parts = [sys.space.sys.id, 'entry', sys.id];
        else if (sys.type === 'Asset')
          parts = [sys.space.sys.id, 'asset', sys.id];
        else
          throw new Error('Unable to encode key for type ' + sys.type);
        return parts.join('!');
      },

      open: function(entry, callback) {
        var key = this._toKey(entry.data.sys);
        var synchronous = true;
        this.connection.open(key, 'json', function(err, doc){
          if (!err) {
            if (synchronous) {
              _.defer(callback, null, doc);
            } else {
              callback(null, doc);
            }
          } else {
            _.defer(callback, err);
          }
        });
        synchronous = false;
      }

    };

    function getDocRoot(type) {
      switch(type){
        case 'Array': return [];
        case 'Object': return {};
        default: return {};
      }
    }

    var ShareJS = {
      client : null,

      connect: function () {
        ShareJS.client = ShareJS.client || new ShareJSClient(url, token || client.persistenceContext.adapter.token);
      },

      open: function () {
        ShareJS.connect();
        return ShareJS.client.open.apply(ShareJS.client, arguments);
      },
      isConnected: function () {
        return ShareJS.client && ShareJS.client.connection == 'ok';
      },
      mkpath: function(params, callback){
        //jshint boss:true
        var doc = params.doc;
        var segments = _.zip(params.path, params.types || []);
        var value = params.value;
        var tmp, prop, segment, currentVal;

        while(segment = segments.shift()) {
          doc = doc.at(segment[0]);
          if (_.isUndefined(currentVal = doc.get())){
            segments.unshift(segment);
            prop = segments.pop()[0];
            while(segments.length > 0) {
              segment = segments.pop();
              tmp = getDocRoot(segment[1]);
              tmp[prop] = value;
              value = tmp;
              prop = segment[0];
            }
            doc.set(value, callback);
            return;
          }
        }
        // If value at path doesn't match passed in value type replace it
        if (_.isString(currentVal)  && _.isString(value) ) {_.defer(callback); return;}
        if (_.isNumber(currentVal)  && _.isNumber(value) ) {_.defer(callback); return;}
        if (_.isBoolean(currentVal) && _.isBoolean(value)) {_.defer(callback); return;}
        if (_.isNull(currentVal)    && _.isNull(value)   ) {_.defer(callback); return;}
        if (_.isObject(currentVal)  && _.isObject(value) &&
            _.isArray(currentVal)  === _.isArray(value)) {_.defer(callback); return;}
        doc.set(value, callback);
      },

      peek: function(doc, path) {
        try {
          return doc.getAt(path);
        } catch(e) {
          return void(0);
        }
      }
    };

    return ShareJS;
  
  };
});
