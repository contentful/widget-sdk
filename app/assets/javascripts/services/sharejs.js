angular.module('contentful/services').provider('ShareJS', function ShareJSProvider() {
  'use strict';

  var token;
  var ShareJSHelper = UserInterface.client.ShareJSHelper;
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
    return new ShareJSHelper.Client(sharejs, url, _token);
  };
});
