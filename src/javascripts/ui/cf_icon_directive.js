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
 * @param {string} name Name of the icon to be used
 * @param {float} scale? Scale factor to be applied to the icon
 */
angular.module('cf.ui')
.directive('cfIcon', ['icons', function (icons) {
  return {
    restrict: 'E',
    link: function (_scope, el, attrs) {
      // TODO: Cache parsed element for <cf-icon/> using the same svg.
      var iconTemplate = icons[attrs.name];
      var iconElem = $(iconTemplate).get(0);
      if (!iconElem) {
        return;
      }

      var scale = parseFloat(attrs.scale);
      if (scale === 0) {
        iconElem.removeAttribute('width');
        iconElem.removeAttribute('height');
      } else if (!isNaN(scale)) {
        var width = parseInt(iconElem.getAttribute('width'), 10);
        var height = parseInt(iconElem.getAttribute('height'), 10);
        iconElem.setAttribute('width', width * scale);
        iconElem.setAttribute('height', height * scale);
      }

      el.append(iconElem);
    }
  };
}]);
