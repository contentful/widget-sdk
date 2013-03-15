angular.module('contentful/services').provider('ShareJS', function ShareJSProvider(environmentProvider) {
  'use strict';

  var token;
  var ShareJSHelper = UserInterface.client.ShareJSHelper;
  var url = '//'+environmentProvider.env.ot_host+'/channel';

  this.token= function(e) {
    token = e;
  };

  this.url = function(e) {
    url = e;
  };

  this.$get = function(client) {
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
    return c;
  };
});
