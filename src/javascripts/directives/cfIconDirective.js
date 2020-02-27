import { registerDirective } from 'NgRegistry';
import createMountPoint from 'ui/Framework/DOMRenderer';
import { isFunction } from 'lodash';

import svgArrowUpEs6 from 'svg/arrow-up.svg';
import svgCheckmarkEs6 from 'svg/checkmark.svg';
import svgDdArrowDownEs6 from 'svg/dd-arrow-down.svg';
import svgLinkEs6 from 'svg/link.svg';
import svgLockEs6 from 'svg/lock.svg';
import svgPageApisEs6 from 'svg/page-apis.svg';
import svgPageAppsEs6 from 'svg/page-apps.svg';
import svgPageContentEs6 from 'svg/page-content.svg';
import svgPageCtEs6 from 'svg/page-ct.svg';
import svgPageEntriesEs6 from 'svg/page-entries.svg';
import svgPageMediaEs6 from 'svg/page-media.svg';
import svgPageSettingsEs6 from 'svg/page-settings.svg';

const SVGs = {
  'arrow-up': svgArrowUpEs6,
  checkmark: svgCheckmarkEs6,
  'dd-arrow-down': svgDdArrowDownEs6,
  link: svgLinkEs6,
  lock: svgLockEs6,
  'page-apis': svgPageApisEs6,
  'page-apps': svgPageAppsEs6,
  'page-content': svgPageContentEs6,
  'page-ct': svgPageCtEs6,
  'page-entries': svgPageEntriesEs6,
  'page-media': svgPageMediaEs6,
  'page-settings': svgPageSettingsEs6
};

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
  registerDirective('cfIcon', () => ({
    restrict: 'E',
    link: function(_scope, el, attrs) {
      const mountPoint = createMountPoint(el.get(0));
      const icon = SVGs[attrs.name];
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
  }));
}
