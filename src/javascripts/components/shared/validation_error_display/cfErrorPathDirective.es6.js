import { registerDirective } from 'NgRegistry.es6';

/**
 * Provide error messages for the selected part of a document from the
 * `validate` directive.
 *
 * The directive exposes the errors for the part of the document corresponding to
 * the `cf-error-path` attribute. It provides the following properties
 * on the `errors` controller:
 *
 * - `messages` A list of error message strings.
 * - `isEmpty` True if and only if there are any error messages.
 * - `hasErrors` Complement of `hasErrors`
 *
 * In addition it hides the element if there are no error messages.
 *
 */
registerDirective('cfErrorPath', () => ({
  scope: true,
  controller: 'ErrorPathController',
  controllerAs: 'errors',
  require: 'cfErrorPath',

  link: function(scope, elem, attrs) {
    scope.$watch('errors.hasErrors', hasErrors => {
      if (!attrs['ngHide'] && !attrs['ngShow']) {
        elem.toggle(hasErrors);
      }
    });
  }
}));
