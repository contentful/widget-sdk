'use strict';

angular.module('contentful').directive('cfMultiVideoItem', [function(){
  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_multi_video_item'](),
    controller : 'cfMultiVideoItemController',
    controllerAs: 'multiVideoItemController'
  };
}]);
