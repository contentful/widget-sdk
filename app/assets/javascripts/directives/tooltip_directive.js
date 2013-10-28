'use strict';

angular.module('contentful').
  directive('tooltip', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var tooltipInitialized = false;

        element.on('mouseenter focus', initialize);

        function initialize() {
          if (tooltipInitialized || scope.disableTooltip) return;
          createTooltip(true);
          element.off('mouseenter focus', initialize);
          tooltipInitialized = true;
        }

        function createTooltip(show) {
          element.tooltip({
            delay: {show: 100, hide: 100},
            placement: attrs.tooltipPlacement,
            title: function () {
              return attrs.tooltip;
            }
          });
          if (show) element.tooltip('show');
        }

        function destroyTooltip() {
          element.tooltip('destroy');
        }

        scope.$watch('disableTooltip', disableHandler);
        scope.$watch(attrs.ngDisabled, disableHandler);

        function disableHandler(disabled) {
          if (!tooltipInitialized) return;
          if(disabled) destroyTooltip();
          if(!disabled) createTooltip();
        }

        element.on('$destroy', function () {
          destroyTooltip();
          element.off('mouseenter focus', initialize);
        });
      }
    };
  });
