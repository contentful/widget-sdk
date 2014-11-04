'use strict';

angular.module('contentful').directive('spaceView', function(){
  return {
    template: JST.space_view(),
    restrict: 'E',
    controller: 'SpaceController'
  };
});
