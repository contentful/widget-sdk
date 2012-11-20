define([
  'services',
  'lodash'
], function(services, _){
  'use strict';

  function Routing($location, $route) {
    this.$location = $location;
    this.$route = $route;

    // this.parseLocation();
  }

  Routing.prototype = {
    getPath: function(){
      var path = '/';
      if (this.bucketId) {
        path += 'buckets/' + this.bucketId;
      }
      if (this.entitySection == 'entries') {
        path += '/entries'
      } else if (this.entitySection == 'entry_types') {
        path += '/entry_types'
      }
      return path;
    },

    visitBucketId : function(bucketId) {
      this.bucketId = bucketId;
      this.entitySection = null;
      this.updateLocation();
    },

    visitEntitySection : function(entitySection) {
      this.entitySection = entitySection;
      this.updateLocation();
    },

    updateLocation: function(){
      this.$location.path(this.getPath());
    },

    parseLocation: function(){
      console.log(_(this.$route).keys());
      var current = this.$route.current;
      this.bucketId = current.params.bucketId;
      this.entitySection = current.$route.entity_section;
    }
  }

  return services.service('routing', Routing);
});
