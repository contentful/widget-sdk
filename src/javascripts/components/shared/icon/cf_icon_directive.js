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
angular.module('contentful').directive('cfIcon', ['icons', function(icons){

  return {
    restrict: 'E',
    link: function (scope, el, attrs) {
      var icon = $(icons[attrs.name]);

      if(attrs.scale && !isNaN(parseFloat(attrs.scale, 10))) {
        var metadata = {
          width: parseInt(icon.get(0).getAttribute('width'), 10),
          height: parseInt(icon.get(0).getAttribute('height'), 10)
        };
        var scale = parseFloat(attrs.scale, 10);
        icon.get(0).setAttribute('width', metadata.width * scale);
        icon.get(0).setAttribute('height', metadata.height * scale);
      }

      el.append(icon);
    }
  };
}]);
