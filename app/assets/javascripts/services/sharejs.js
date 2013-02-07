angular.module('contentful/services').provider('ShareJS', function ShareJSProvider() {
  'use strict';

  var authentication = 'faketoken';
  var sharejs = require('contentful_client/sharejs');
  var url = document.location.protocol + '//' + document.location.hostname + ':8000/channel';

  this.authentication = function(e) {
    authentication = e;
  };

  this.url = function(e) {
    url = e;
  };

  this.$get = function() {
    return new sharejs.Client(url, authentication);
  };
});
