angular.module('contentful/services').provider('ShareJS', function ShareJSProvider() {
  'use strict';

  var token;
  var sharejs = require('contentful_client/sharejs');
  var url = document.location.protocol + '//' + document.location.hostname + ':8000/channel';

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
    return new sharejs.Client(url, _token);
  };
});
