import { registerDirective } from 'NgRegistry.es6';
import $ from 'jquery';

export default function register() {
  registerDirective('cfPositionRelativeToLanguage', () => ({
    restrict: 'A',

    link: function(_scope, elem, attrs) {
      attrs.$observe('positionRelativeTo', reposition);

      function reposition() {
        const relativeTo = $(attrs.positionRelativeTo);
        if (relativeTo.get(0)) {
          const newMargin = relativeTo.position().left + relativeTo.width() / 2;
          elem.css('marginLeft', newMargin + 'px');
        }
      }
    }
  }));
}
