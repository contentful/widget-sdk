'use strict';
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
