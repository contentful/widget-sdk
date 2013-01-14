'use strict';

function ShareJSProvider() {
  var sharejs = require('contentful_client/sharejs');
  var url = document.location.protocol + '//' + document.location.hostname + ':8000/channel';

  this.url = function(e) {
    url = e;
  };

  this.$get = function() {
    return new sharejs.Client(url);
  };
}

angular.module('contentful/services').provider('ShareJS', ShareJSProvider);
