'use strict';
angular.module('contentful').directive('cfViewMenu', function(){
  return {
    restrict: 'A',
    template: JST.view_menu(),
    controller: 'ViewMenuController'
  };
});
