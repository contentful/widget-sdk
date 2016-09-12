'use strict';

angular.module('contentful').directive('cfVideoSearch', [function(){

  return {
    restrict   : 'E',
    template   : JST['cf_video_search'](),
    controller : 'cfVideoSearchController',
    controllerAs : 'videoSearchController'
  };

}]);
