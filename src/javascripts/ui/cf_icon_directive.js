'use strict';

/*
 * @ngdoc directive
 * @name cfIcon
 *
 * @description
 * This directive is a helper for the SVG icon system
 *
 * It will inject the SVG code for the icon which has been previously generated.
 *
 * @param {string} name - name of the icon to be used
 * @param {float} scale - (optional) scale factor to be applied to the icon
 */
angular.module('cf.ui')
.directive('cfIcon', ['icons', function(icons){
  return {
    restrict: 'E',
    link: function (scope, el, attrs) {
      var icon = $(icons[attrs.name]);
      var scale = parseFloat(attrs.scale);
      if (scale === 0) {
        icon.removeAttr('width');
        icon.removeAttr('height');
      } else if (!isNaN(scale)) {
        var width = parseInt(icon.get(0).getAttribute('width'), 10);
        var height = parseInt(icon.get(0).getAttribute('height'), 10);
        icon.get(0).setAttribute('width', width * scale);
        icon.get(0).setAttribute('height', height * scale);
      }

      el.append(icon);
    }
  };
}]);
