'use strict';

angular.module('contentful').
  directive('tooltip', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        function destroy() {
          $(element).tooltip('destroy');
        }

        attrs.$observe('tooltip', function() {
          destroy();
          $(element).tooltip({
            delay: {show: 100, hide: 100},
            placement: attrs.tooltipPlacement,
            title: attrs.tooltip
          });
        });

        scope.$watch(attrs.ngDisabled, function(disabled) {
          if (disabled) $(element).tooltip('hide');
        });

        element.on('$destroy', destroy);
      }
    };
  });
