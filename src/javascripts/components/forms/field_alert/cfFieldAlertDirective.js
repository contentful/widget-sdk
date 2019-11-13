import { registerDirective } from 'NgRegistry';
import _ from 'lodash';

export default function register() {
  registerDirective('cfFieldAlert', () => ({
    template: '<i class="cf-field-alert fa fa-exclamation-triangle" tooltip></i>',
    replace: true,
    restrict: 'A',

    link: function(_scope, elem, attr) {
      attr.$observe('cfFieldAlert', message => {
        attr.$set('tooltip', message);
        if (_.isEmpty(message)) {
          elem.hide();
        } else {
          elem.show();
        }
      });
    }
  }));
}
