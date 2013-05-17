angular.module('contentful').directive('fieldErrorDisplay', function (validation) {
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
        size: function (v) {
          if (_.isNumber(v.min) && _.isNumber(v.max)) {
            return 'Size must be between ' + v.min + ' and ' + v.max + '.';
          } else if(_.isNumber(v.min)) {
            return 'Size must be at least ' + v.min + '.';
          } else {
            return 'Size must be at most ' + v.max + '.';
          }
        },
        range: function (v) {
          if (_.isNumber(v.min) && _.isNumber(v.max)) {
            return 'Must be between ' + v.min + ' and ' + v.max + '.';
          } else if(_.isNumber(v.min)) {
            return 'Must be larger than ' + v.min + '.';
          } else {
            return 'Must be smaller than ' + v.max + '.';
          }
        },
        regexp: function (v) {
          return 'Must match /' + v.pattern + '/.';
        },
        'in': function (v) {
          return 'Must be one of ' + v.expected.join(', ') + '.';
        },
        present: function() {
          return 'Required';
        }
      };

      $scope.$watch('field', function (field, old, scope) {
        if (field) {
          scope.validations = validation.Field.parse(field).validations;
        } else {
          scope.validations = [];
        }
      });

      $scope.validate = function (value) {
        $scope.errorMessages = _($scope.validations).map(function (v) {
          if (!v.constraint.test(value)) {
            return messages[v.name](v);
          }
        }).compact().value();
      };
      $scope.validateLater = _.debounce(function (value) {
        $scope.$apply(function (scope) {
          scope.validate(value);
        });
      }, 400);

      $scope.$watch('entry.data.fields[field.id][locale.code]', function (value, old, scope) {
        scope.validateLater(value);
      }, true);
    }
  };
});
