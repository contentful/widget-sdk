'use strict';

/*
 * @ngdoc directive
 * @name cfIcon
 *
 * @description
 * This directive is a helper for the SVG icon system
 *
 * It will create an svg tag which references an icon introduced by the cf-icon-definitions
 * directive.
 *
 * See http://24ways.org/2014/an-overview-of-svg-sprite-creation-techniques/ for more information
 * on the technique used.
 *
 * @param {string} name - name of the icon to be used
 * @param {float} scale - (optional) scale factor to be applied to the icon
 */
angular.module('contentful').directive('cfIcon', ['iconMetadataStore', function(iconMetadataStore){

  return {
    restrict: 'E',
    link: function (scope, el, attrs) {
      var width, height;
      var iconId = 'icon-'+attrs.name;
      var metadata = iconMetadataStore.get(iconId);

      if(attrs.scale && !isNaN(parseFloat(attrs.scale, 10))) {
        var scale = parseFloat(attrs.scale, 10);
        width = metadata.width * scale;
        height = metadata.height * scale;
      } else {
        width = metadata.width;
        height = metadata.height;
      }

      el.html('<svg width="'+width+'" height="'+height+'"><use xlink:href="#'+iconId+'" /></svg>');
    }
  };
}]);
