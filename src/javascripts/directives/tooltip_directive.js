'use strict';

angular.module('contentful').
  directive('tooltip', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var tooltipInitialized = false;

        element.on('mouseenter focus', initialize);

        scope.$watch(function () {
          return attrs.ngDisabled;
        }, function(val){
          scope.disableTooltip = !!val;
        });

        function initialize() {
          if (tooltipInitialized || scope.disableTooltip) return;
          createTooltip(true);
          element.off('mouseenter focus', initialize);
          tooltipInitialized = true;
        }

        function getOptions() {
          var options = {
            title: function(){ return attrs.tooltip; },
            delay: {show: 100, hide: 100}
          };
          var newKey;
          if(attrs.tooltipDelayShow){
            options.delay.show = attrs.tooltipDelayShow;
            delete attrs.tooltipDelayShow;
          }
          if(attrs.tooltipDelayHide){
            options.delay.hide = attrs.tooltipDelayHide;
            delete attrs.tooltipDelayHide;
          }
          _.forEach(attrs, function (val, key) {
            if(/^tooltip(.+)/.test(key)){
              newKey = key.replace('tooltip', '').toLowerCase();
              options[newKey] = val;
            }
          });
          return options;
        }

        function createTooltip(show) {
          var options = getOptions();
          element.tooltip(options);
          if (show) element.tooltip('show');
        }

        function destroyTooltip() {
          element.tooltip('destroy');
        }

        scope.$watch('disableTooltip', disableHandler);
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
