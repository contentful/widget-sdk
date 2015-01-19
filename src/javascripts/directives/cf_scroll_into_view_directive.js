'use strict';
angular.module('contentful').directive('cfScrollIntoView', function(){
  return {
    restrict: 'A',
    link: function(scope, elem){
      elem.get(0).scrollIntoView();
    }
  };
});
