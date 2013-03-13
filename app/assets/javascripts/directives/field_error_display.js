angular.module('contentful/directives').directive('fieldErrorDisplay', function () {
  'use strict';

  return {
    restrict: 'C',
    template: JST['field_error_display'],
    link: function (scope, elem) {
      scope.$watch('errorMessages.length', function (numErrors) {
        if (0 < numErrors) {
          elem.show();
        } else {
          elem.hide();
        }
      });
    },
    controller: function FieldErrorDisplayCtrl($scope) {
      $scope.errorMessages = [];

      var messages = {
        size: function (validation) {
          if (_.isNumber(validation.min) && _.isNumber(validation.max)) {
            return 'Size must be between ' + validation.min + ' and ' + validation.max + '.';
          } else if(_.isNumber(validation.min)) {
            return 'Size must be larger than ' + validation.min + '.';
          } else {
            return 'Size must be smaller than ' + validation.max + '.';
          }
        },
        range: function (validation) {
          if (_.isNumber(validation.min) && _.isNumber(validation.max)) {
            return 'Must be between ' + validation.min + ' and ' + validation.max + '.';
          } else if(_.isNumber(validation.min)) {
            return 'Must be larger than ' + validation.min + '.';
          } else {
            return 'Must be smaller than ' + validation.max + '.';
          }
        },
        regexp: function (validation) {
          return 'Must match ' + validation.expression + '.';
        },
        in: function (validation) {
          return 'Must be one of ' + validation.expected.join(', ') + '.';
        }
      };

      $scope.$watch('field', function (field, old, scope) {
        if (field) {
          scope.validations = UserInterface.validation.Field.parse(field).validations;
        } else {
          scope.validations = [];
        }
      });

      $scope.validate = function (value) {
        $scope.errorMessages = _($scope.validations).map(function (validation) {
          if (!validation.constraint.test(value)) {
            return messages[validation.name](validation);
          }
        }).compact().value();
      };
      $scope.validate = _.debounce($scope.validate, 400);

      $scope.$watch('entry.data.fields[field.id][locale]', function (value, old, scope) {
        scope.validate(value);
      }, true);
    }
  };
});
