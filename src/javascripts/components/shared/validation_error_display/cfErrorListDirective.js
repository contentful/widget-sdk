import { registerDirective } from 'NgRegistry';

export default function register() {
  /**
   * Shows a list of errors in `scope.errors.messages`.
   *
   * The directive hides its element if there are no error messages.
   */
  registerDirective('cfErrorList', () => ({
    restrict: 'E',
    template: `<ul>
      <li ng-repeat="(index, error) in errors.messages track by index">{{error}}</li>
    </ul>`,

    link: function (scope, element, attrs) {
      scope.$watchCollection('errors.messages', (messages) => {
        if (attrs['ngHide'] || attrs['ngShow']) {
          return;
        }

        if (messages && messages.length > 0) {
          element.show();
        } else {
          element.hide();
        }
      });
    },
  }));
}
