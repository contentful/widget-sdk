'use strict';
angular.module('contentful').directive('cfOnBlurComponent', ['$document', '$parse', function($document, $parse){
  // A better replacement for clickoutside that tracks both blur and focus
  // so, whether you leave a component by mouse or keyboard doesn't matter
  // - NOTE: Oops this..blur != that.focus. You can blur somthing without focusin something else.
  //   For example elements with tabindex do not cause focus
  // - NOTE: For now this doesn't serve a better purpose than cfClickOutside, with the exception that
  //   it doesn't bind element.click (something nobody knows why cfClickOutside is doing it)
  return {
    restrict: 'A',
    link: function(scope, elem, attr){
      var fn = $parse(attr.cfOnBlurComponent);

      $document.on('click focus', clickHandler);
      elem.bind('remove', function () {
        $document.off('click focus', clickHandler);
      });

      function clickHandler(event) {
        event.stopPropagation();
        var targetParents = $(event.target).parents();
        var inside = targetParents.index(elem) !== -1;
        var on     = event.target === elem[0];
        var outside = !inside && !on;

        if (outside) scope.$apply(function() {
          fn(scope, {$event:event});
        });
      }
    }
  };
}]);
