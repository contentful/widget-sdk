angular.module('contentful').provider('ShareJS', function ShareJSProvider(environment, contentfulClient) {
  /*global sharejs*/
  'use strict';

  var token;
  var ShareJSHelper = contentfulClient.ShareJSHelper;
  var url = '//'+environment.settings.ot_host+'/channel';

  this.token= function(e) {
    token = e;
  };

  this.url = function(e) {
    url = e;
  };

  this.$get = function(client, $rootScope) {
    var _token;
    if (token) {
      _token = token;
    } else {
      _token = client.persistenceContext.adapter.token;
    }
    var c = new ShareJSHelper.Client(sharejs, url, _token);
    // Monkey patch for better Angular compatiblity
    c.connection.socket.send = function (message) {
      return this.sendMap({JSON: angular.toJson(message)});
    };
    c.connection.on('ok', function () {
      //console.log('ShareJS connection ok', c.connection.state );
      stateChangeHandler();
    });
    c.connection.on('error', function (e) {
      //console.log('ShareJS connection error', c.connection.state, e);
      stateChangeHandler(e);
    });
    c.connection.on('connect failed', function () {
      //console.log('ShareJS connect failed', c.connection.state);
      stateChangeHandler();
    });

    function stateChangeHandler(error) {
      $rootScope.$apply(function (scope) {
        scope.$broadcast('otConnectionStateChanged', c.connection.state, c.connection, error);
      });
    }
    return c;
  };
});
