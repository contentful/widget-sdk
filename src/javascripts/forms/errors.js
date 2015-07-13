'use strict';

angular.module('cf.forms')

/**
 * @ngdoc directive
 * @module cf.forms
 * @name cfFieldErrorFor
 * @usage[jade]
 * form
 *   input(name="myfield")
 *   span(cf-field-error-for="myfield")
 *
 * @description
 * Show the first error message for the given field.
 *
 * Uses the `FieldErrorController` to provide the error messages. The
 * element is hidden when there are no messages.
 *
 * @param {string} fieldName
 * The name of the form field we want to show errors for
 */
.directive('cfFieldErrorFor', [function () {
  return {
    scope: {
      fieldName: '@cfFieldErrorFor'
    },
    require: '^form',
    template: '{{errors.messages[0]}}',
    controllerAs: 'errors',
    controller: 'FieldErrorController',
    link: function (scope, elem, attrs, form) {
      scope.errors.link(form, scope.fieldName);
      scope.$watch('errors.exist && !errors.hide', function (hasErrors) {
        elem.toggleClass('ng-hide', !hasErrors);
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @module cf.forms
 * @name cfFieldErrorsFor
 * @usage[jade]
 * form
 *   input(name="myfield")
 *   ul(cf-field-errors-for="myfield")
 *
 * @description
 * Show all the error messages for the given field in `<li>` tags.
 *
 * Uses the `FieldErrorController` to provide the error messages. The
 * element is hidden when there are no messages.
 *
 * @param {string} fieldName
 * The name of the form field we want to show errors for
 */
.directive('cfFieldErrorsFor', [function () {
  return {
    scope: {
      fieldName: '@cfFieldErrorsFor'
    },
    require: '^form',
    template: '<li ng-repeat="m in errors.messages">{{m}}</li>',
    controllerAs: 'errors',
    controller: 'FieldErrorController',
    link: function (scope, elem, attrs, form) {
      scope.errors.link(form, scope.fieldName);
      scope.$watch('errors.exist && !errors.hide', function (hasErrors) {
        elem.toggleClass('ng-hide', !hasErrors);
      });
    }
  };
}])

/**
 * @ngdoc type
 * @module cf.forms
 * @name FieldErrorController
 * @usage[js]
 * $scope.fieldErrorController.link(formCtrl, fieldName)
 *
 * @description
 * Provides error messages for a given field.
 *
 * @property {string[]} messages
 *   A list of error messages for the form field the controller is
 *   attached to
 * @property {boolean} exist
 *   True if and only if there are errors for the form field the
 *   controller is attached to.
 * @property {boolean} hide
 *   Corresponds to the form controllers `hideErrors` property.
 */
.controller('FieldErrorController', ['$scope', '$injector',
function ($scope, $injector) {
  var fieldErrorMessage = $injector.get('fieldErrorMessage');
  var controller = this;
  var unwatchErrors, unwatchHide;

  /**
   * @ngdoc method
   * @name FieldErrorController#link
   * @description
   * Set up the controller to provide error messages for a given form
   * control.
   *
   * @param {FormController} form
   * @param {string} formCtrlName
   */
  controller.link = function (form, ctrlName) {
    if (!ctrlName)
      throw new TypeError('FieldErrorController#link(): argument required');

    if (unwatchErrors) unwatchErrors();
    if (unwatchHide) unwatchHide();

    unwatchErrors = $scope.$watchCollection(ngModelError, function (errors) {
      var errorDetails = (form[ctrlName] || {}).errorDetails || {};

      controller.messages = _.map(_.keys(errors), function (error) {
        var details = errorDetails[error] || {};
        return details.message || fieldErrorMessage(error, details);
      });

      controller.exist = controller.messages.length > 0;
    });

    unwatchHide = $scope.$watch(function () {
      return form[ctrlName] && form[ctrlName].hideErrors;
    }, function (hideErrors) {
      controller.hide = hideErrors;
    });

    function ngModelError() {
      return form[ctrlName] && form[ctrlName].$error;
    }
  };
}])

/**
 * @ngdoc service
 * @name fieldErrorMessage
 * @usage[js]
 * fieldErrorMessage('required') // => 'Please provide a value'
 *
 * @description
 * Build messages for `ngModel` validation errors.
 */
.provider('fieldErrorMessage', function fieldErrorMessageProvider() {
  var messages = {
    required: 'Please provide a value.'
  };

  this.add = function (key, message) {
    messages[key] = message;
  };

  this.$get = function () {
    var templates = _.mapValues(messages, function (message) {
      return _.template(message);
    });

    return function build (key, details) {
      if (key in templates)
        return templates[key](details);
      else
        return 'Error: ' + key;
    };
  };

});
