'use strict';

/**
 * Provide error messages for the selected part of a document from the
 * `validate` directive.
 *
 * The directive exposes the errors for the part of the document corresponding to
 * the `cf-error-path` attribute. It provides the following scope properties:
 *
 * - `errorMessages` A list of error message strings.
 * - `hasErrors` True if and only if there are any error messages.
 * - `noErrors` Complement of `hasErrors`
 *
 * In addition it hides the element if there are no error messages.
 *
 */
angular.module('contentful').directive('cfErrorPath', function () {
  return {
    scope: true,
    controller: 'ErrorPathController',
    require: 'cfErrorPath',
    link: function (scope, elem, attrs) {
      scope.$watch('hasErrors', function (hasErrors) {
        if (!attrs['ngHide'] && !attrs['ngShow'])
          elem.toggle(hasErrors);
      });
    }
  };
});
