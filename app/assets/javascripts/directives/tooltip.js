'use strict';

angular.module('contentful').
  directive('tooltip', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        attrs.$observe('tooltip', function() {
          $(element).tooltip('destroy');
          $(element).tooltip({
            delay: {show: 100, hide: 100},
            placement: attrs.tooltipPlacement,
            title: attrs.tooltip
          });
        });

        scope.$watch(attrs.ngDisabled, function(disabled) {
          if (disabled) $(element).tooltip('hide');
        });
      }
    };
  });
