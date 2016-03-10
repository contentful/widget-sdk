'use strict';

angular.module('contentful').directive('cfPositionRelativeToLanguage', ['$injector', function($injector){
  var defer    = $injector.get('defer');

  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      defer(reposition);
      attrs.$observe('positionRelativeTo', reposition);

      function reposition() {
        var relativeTo = $(attrs.positionRelativeTo);
        if (relativeTo.get(0)) {
          var newMargin = relativeTo.position().left + relativeTo.width() / 2;
          elem.css('marginLeft', newMargin+'px');
        }
      }
    }
  };
}]);
