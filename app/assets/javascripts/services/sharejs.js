define([
  'services',
  'contentful_client/sharejs'
], function(services, sharejs){
  'use strict';

  var url = document.location.protocol + '//' + document.location.hostname + ':8000/channel';

  function ShareJSProvider() {
    this.url = function(e) {
      url = e;
    };

    this.$get = function() {
      return new sharejs.Client(url);
    };
  }

  return services.provider('ShareJS', ShareJSProvider);
});
