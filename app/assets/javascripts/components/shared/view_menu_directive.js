'use strict';
angular.module('contentful').directive('viewMenu', function(){
  return {
    restrict: 'A',
    template: JST['view_menu'](),
    controller: 'ViewMenuController'
  };
});
