'use strict';
/**
 * Directive to tell a DOM element what to center on
 *
 * Usage: <div cf-center-on=".container"></div>
 *
 * On window.resize, use jQueries element.position to reposition the element
 * on the supplied selector
 */
angular.module('contentful').directive('cfCenterOn', ['$injector', function($injector){
  var $window  = $injector.get('$window');
  var debounce = $injector.get('debounce');

  return {
    restrict: 'A',
    link: function(scope, elem, attr){
      reposition();
      var debouncedReposition = debounce(reposition, 50);
      $($window).on('resize', debouncedReposition);

      elem.on('$destroy', function () {
        $($window).off('resize', debouncedReposition);
      });

      function reposition() {
        elem.position({
          my: 'center',
          at: 'center',
          of: attr.cfCenterOn
        });
      }
    }
  };
}]);
