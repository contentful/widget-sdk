import { registerDirective } from 'core/NgRegistry';
import _ from 'lodash';
import defer from 'lodash/defer';
import * as K from 'utils/kefir';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfFocusOtInput
   * @description
   * Directive to focus a child OT enabled input element
   *
   * The cf-focus-ot-input attribute can be empty which means the element will
   * always be focused, or it can contain an expression which will be evaluated
   * on the scope and focus the field only if true.
   *
   * This directive can be used to focus the title field on an entry/asset,
   * which while simple to determine on an asset, it can be more complex on an
   * entry, hence the condition to verify if focus should occur.
   *
   * @usage[html]
   * <div cf-focus-ot-input="optionalExpression"></div>
   */
  registerDirective('cfFocusOtInput', [
    () => ({
      restrict: 'A',
      link: function (scope, elem, attrs) {
        if (scope.$eval(attrs.cfFocusOtInput) || _.isEmpty(attrs.cfFocusOtInput)) {
          K.onValueScope(scope, scope.otDoc.state.loaded$, (loaded) => {
            if (loaded) {
              const input = elem.find('input').eq(0);
              defer(() => {
                input.focus();
              });
            }
          });
        }
      },
    }),
  ]);
}
