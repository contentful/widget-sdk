'use strict';

angular.module('contentful').directive('cfOoyalaSearch', [function(){

  return {
    restrict   : 'E',
    template   : JST['cf_ooyala_search'](),
    controller : 'cfOoyalaSearchController',
    controllerAs : 'searchController'
  };

}]);
