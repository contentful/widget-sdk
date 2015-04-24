'use strict';

/*
 * This directive is a helper for the SVG icon system
 *
 * It includes an object tag with a reference to the icon ID in the SVG file and
 * it defines the dimensions on the object tag, which is the only way of properly
 * specifying dimensions for this use case.
 *
 * You can either
 * - Specify a scale which is a multiplier of the original dimensions of the icon
 * - Specify a width and height, which need to respect the ratio of the original icon
 *
 * It's recommended the scale is used unless a very explicit measurement is required.
 *
 */
angular.module('contentful').directive('cfIcon', ['prefixAssetHostFilter', '$window', function(prefixAssetHostFilter, $window){

  var DEFAULT_DIMENSIONS = {
    width: 50,
    height: 50
  };

  /**
   * Safari has weird glitching issues using an img tag to include svg sprites.
   * A way to bypass that, is to append a querystring to the svg file path.
   * Using the icon name in the query string is enough to make it behave.
   * http://betravis.github.io/icon-methods/svg-sprite-sheets.html
   */
  var isSafari = /Version\/(\d|\.|\s)+Safari/.test($window.navigator.userAgent);

  function getDimension(value, defaultValue) {
    var intValue = parseInt(value, 10);
    if(value && !isNaN(intValue))
      return intValue;
    return defaultValue;
  }

  return {
    restrict: 'E',
    link: function (scope, el, attrs) {
      var width, height;
      var imagePath = prefixAssetHostFilter('/app/images/contentful_icons.svg');
      var qs = isSafari ? '?'+attrs.name : '';

      if(attrs.size) {
        width = getDimension(attrs.size, DEFAULT_DIMENSIONS.width);
        height = getDimension(attrs.size, DEFAULT_DIMENSIONS.height);
      } else if(attrs.width || attrs.height) {
        width = getDimension(attrs.width, DEFAULT_DIMENSIONS.width);
        height = getDimension(attrs.height, DEFAULT_DIMENSIONS.height);
      } else if(attrs.scale && !isNaN(parseFloat(attrs.scale, 10))) {
        var scale = parseFloat(attrs.scale, 10);
        width = DEFAULT_DIMENSIONS.width * scale;
        height = DEFAULT_DIMENSIONS.height * scale;
      }


      el.html(
        '<img class="cf-icon" '+
        'width="'+ width +'" height="'+ height +'" src="'+
        imagePath +qs+'#'+ attrs.name +'" />'
      );

    }
  };
}]);
