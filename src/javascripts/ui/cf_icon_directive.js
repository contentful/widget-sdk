'use strict';

/*
 * @ngdoc directive
 * @name cfIcon
 * @description
 * This directive is a helper for the SVG icon system
 *
 * It will inject the SVG code for the icon which has been previously generated.
 * @usage[jade]
 * cf-icon(name="close")
 * cf-icon(name="close" scale="2")
 * cf-icon(name="close" height="20")
 */
angular.module('cf.ui').directive('cfIcon', [
  'require',
  require => {
    var createMountPoint = require('ui/Framework/DOMRenderer.es6').default;

    return {
      restrict: 'E',
      link: function(_scope, el, attrs) {
        var mountPoint = createMountPoint(el.get(0));
        mountPoint.render(require('svg/' + attrs.name + '.es6').default);

        var iconElem = el.children().get(0);
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

        var setHeight = parseFloat(attrs.height);
        if (!isNaN(setHeight)) {
          iconElem.setAttribute('height', setHeight);
        }
      }
    };
  }
]);
