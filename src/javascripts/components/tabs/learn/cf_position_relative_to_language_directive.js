'use strict';

angular.module('contentful').directive('cfPositionRelativeToLanguage', function(){
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
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
});
