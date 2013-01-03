define([
  'angular'
], function(angular){
  'use strict';

  var filters = angular.module('filters', []);
  
  filters.filter('dateTime', function() {
    return function(unixTime) {
      if (unixTime) {
        return new Date(unixTime).toLocaleString('de-DE');
      } else {
        return unixTime;
      }
    };
  });

  return filters;
});
