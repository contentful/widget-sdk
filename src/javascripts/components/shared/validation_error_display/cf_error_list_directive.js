'use strict';

/**
 * Shows a list of errors in `scope.errors.messages`.
 *
 * The directive hides its element if there are no error messages.
 */
angular.module('contentful').directive('cfErrorList', () => ({
  restrict: 'E',
  template: JST['cf_error_list'],

  link: function (scope, element, attrs) {
    scope.$watchCollection('errors.messages', messages => {
      if (attrs['ngHide'] || attrs['ngShow']) { return; }

      if (messages && messages.length > 0) { element.show(); } else { element.hide(); }
    });
  }
}));
