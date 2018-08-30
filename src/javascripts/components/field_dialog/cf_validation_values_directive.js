'use strict';

/**
 * Shows a list of fixed values of the `in` validation and an input
 * field to add values.
 */
angular.module('contentful').directive('cfValidationValues', [
  'require',
  require => {
    const KEYCODES = require('utils/keycodes.es6').default;
    const normalizeWhiteSpace = require('stringUtils').normalizeWhiteSpace;

    const ERROR_MESSAGES = {
      integerOutOfRange: 'Number is out of range.',
      numberOverflow: 'Numbers should be 21 characters long or less (use a text field otherwise).',
      emptyValue: 'The input is empty. Please add some non-whitespace characters.',
      numberParsingFailed: 'You can only add number values.',
      numberNotAnInteger: 'You can only add integer values.',
      stringTooLong: 'Values must be 85 characters or less.',
      duplicate: 'This value already exists on the list.'
    };

    // The maximum number of digits we can represent without rounding
    // errors.
    const MAX_PRECISION = 21;

    return {
      scope: true,
      restrict: 'E',
      template: JST.cf_validation_values(),
      link: function($scope) {
        if (!$scope.validation.settings) {
          $scope.validation.settings = [];
        }

        $scope.items = $scope.validation.settings;

        $scope.$watch('inputValue', inputValue => {
          if (!inputValue) {
            $scope.errorMessages = [];
          }
        });

        $scope.addItem = ev => {
          let value = ev.target.value;
          if (ev.keyCode !== KEYCODES.ENTER || !value) {
            return;
          }

          try {
            value = parseValue(value, $scope.field.type);
          } catch (e) {
            setError(e.message);
            return;
          }

          if (_.includes($scope.items, value)) {
            setError(ERROR_MESSAGES.duplicate);
            return;
          }

          $scope.items.push(value);
          $scope.validator.run();
          $scope.errorMessages = [];
          ev.target.value = '';
        };

        $scope.removeItem = i => {
          $scope.items.splice(i, 1);
          $scope.validator.run();
        };

        /**
         * Take a string and parse it into a number if the field type is
         * 'Integer' or 'Number'. Otherwise return the string as-is.
         *
         * The function throws errors if the value could not be parsed
         * correctly.
         */
        function parseValue(value, type) {
          if (type === 'Number' || type === 'Integer') {
            if (type === 'Number' && value.length > MAX_PRECISION) {
              throw new Error(ERROR_MESSAGES.numberOverflow);
            }

            value = value.replace(',', '.');
            value = parseFloat(value, 10);

            if (isNaN(value)) {
              throw new Error(ERROR_MESSAGES.numberParsingFailed);
            }

            if (type === 'Integer') {
              if (!_.isInteger(value)) {
                throw new Error(ERROR_MESSAGES.numberNotAnInteger);
              }

              if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
                throw new Error(ERROR_MESSAGES.integerOutOfRange);
              }
            }

            return value;
          } else {
            value = normalizeWhiteSpace(value);
            if (value.length > 85) {
              throw new Error(ERROR_MESSAGES.stringTooLong);
            }

            if (!value) {
              throw new Error(ERROR_MESSAGES.emptyValue);
            }

            return value;
          }
        }

        function setError(message) {
          $scope.errorMessages = [message];
        }
      }
    };
  }
]);
