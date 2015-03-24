'use strict';

// Works like ng-click but instead evaluates the argument
// when the click is _outside_ of the element
//
// I don't know what the cfClickOutsideIgnore argument does, 
// that was Tiago's invention.
angular.module('contentful').directive('cfClickOutside', ['$parse', '$document', function($parse, $document){
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
      var fn = $parse(attr.cfClickOutside);
      var ignored = $(attr.cfClickOutsideIgnore);

      $document.bind('click', clickOutsideHandler);
      element.bind('remove', function () {
        $document.unbind('click', clickOutsideHandler);
      });

      function isIgnored(target) {
        return _.any(ignored, function (el) {
          return el === target;
        });
      }

      function clickOutsideHandler(event) {
        if(!scope.$eval(attr.cfClickOutsideWhen)) return;
        event.stopPropagation();
        var targetParents = $(event.target).parents();
        var inside = targetParents.index(element) !== -1;
        var on     = event.target === element[0];
        var clickOutside = !inside && !on && !isIgnored(event.target);

        if (clickOutside) scope.$apply(function() {
          fn(scope, {$event:event});
        });
      }

      element.bind('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        scope.$apply(function() {
          fn(scope, {$event:event});
        });
      });
    }
  };
}]);

