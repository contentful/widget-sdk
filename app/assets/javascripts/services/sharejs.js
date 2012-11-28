define([
  'services',
  'sharejs'
], function(services, sharejs){
  'use strict';

  function ConnectionProvider() {
    var url = document.location.protocol + '//' + document.location.hostname + ':8000/channel';

    this.url = function(e) {
      url = e;
    };

    this.$get = function() {
      return new sharejs.Connection(url);
    };
  }

  return services.provider('sharejs', ConnectionProvider);
});
