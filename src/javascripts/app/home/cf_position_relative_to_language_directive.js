'use strict';

angular.module('contentful')
.directive('cfPositionRelativeToLanguage', () => ({
  restrict: 'A',

  link: function (_scope, elem, attrs) {
    attrs.$observe('positionRelativeTo', reposition);

    function reposition () {
      const relativeTo = $(attrs.positionRelativeTo);
      if (relativeTo.get(0)) {
        const newMargin = relativeTo.position().left + relativeTo.width() / 2;
        elem.css('marginLeft', newMargin + 'px');
      }
    }
  }
}));
