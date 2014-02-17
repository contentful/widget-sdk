'use strict';

// A version of ngClick that performs stopPropagation() and
// preventDefault() to support nested click targets
angular.module('contentful').directive('cfClickLocal', function($parse){
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      var fn = $parse(attr.cfClickLocal);
      element.on('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        scope.$apply(function() {
          fn(scope, {$event:event});
        });
      });
    }
  };
});
