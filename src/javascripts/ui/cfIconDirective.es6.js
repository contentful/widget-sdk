import { registerDirective } from 'NgRegistry.es6';
import createMountPoint from 'ui/Framework/DOMRenderer.es6';
import { isFunction } from 'lodash';

export default function register() {
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
  registerDirective('cfIcon', [
    '$injector',
    $injector => ({
      restrict: 'E',
      link: function(_scope, el, attrs) {
        const mountPoint = createMountPoint(el.get(0));
        const icon = $injector.get('svg/' + attrs.name + '.es6').default;
        mountPoint.render(isFunction(icon) ? icon() : icon);

        const iconElem = el.children().get(0);
        if (!iconElem) {
          return;
        }

        const scale = parseFloat(attrs.scale);
        if (scale === 0) {
          iconElem.removeAttribute('width');
          iconElem.removeAttribute('height');
        } else if (!isNaN(scale)) {
          const width = parseInt(iconElem.getAttribute('width'), 10);
          const height = parseInt(iconElem.getAttribute('height'), 10);
          iconElem.setAttribute('width', width * scale);
          iconElem.setAttribute('height', height * scale);
        }

        const setHeight = parseFloat(attrs.height);
        if (!isNaN(setHeight)) {
          iconElem.setAttribute('height', setHeight);
        }
      }
    })
  ]);
}
