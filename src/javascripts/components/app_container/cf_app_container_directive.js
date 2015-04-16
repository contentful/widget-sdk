'use strict';

angular.module('contentful').directive('cfAppContainer', function(){
  return {
    template: JST.cf_app_container(),
    restrict: 'E',
    //FIXME move this further down maybe
    controller: 'SpaceController'
  };
});
