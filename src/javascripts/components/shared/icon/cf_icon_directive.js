'use strict';

angular.module('contentful').directive('cfIcon', [function(){
  return {
    template: JST.cf_icon(),
    restrict: 'E',
    scope: {
      name: '@name'
    }
  };
}]);
