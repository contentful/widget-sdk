'use strict';

angular.module('contentful').
  directive('tooltip', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element = $(element);
        function destroy() {
          element.tooltip('destroy');
        }

        function createTooltip() {
          destroy();
          element.tooltip({
            delay: {show: 100, hide: 100},
            placement: attrs.tooltipPlacement,
            title: attrs.tooltip
          });
        }

        attrs.$observe('tooltip', createTooltip);

        scope.$watch(attrs.disableTooltip, disableHandler);
        scope.$watch(attrs.ngDisabled, disableHandler);

        function disableHandler(disabled) {
          if(disabled) destroy();
          if(!disabled) createTooltip();
        }

        element.on('$destroy', destroy);
      }
    };
  });
