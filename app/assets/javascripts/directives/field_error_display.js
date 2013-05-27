'use strict';

angular.module('contentful').directive('fieldErrorDisplay', function () {
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
        linkEntryType: function(v) {
          var et = _.find($scope.bucketContext.publishedEntryTypes, function(et) {
            return et.getId() === v.entryTypeId;
          });
          if (!et) return 'Invalid Content Type';
          return 'Linked entry\'s Content Type must be ' + et.data.name + '.';
        },
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
            return 'Must be at least ' + v.min + '.';
          } else {
            return 'Must be at most ' + v.max + '.';
          }
        },
        regexp: function (v) {
          return 'Must match /' + v.pattern + '/.';
        },
        'in': function (v) {
          return 'Must be one of ' + v.expected.join(', ') + '.';
        },
        required: function() {
          return 'Required';
        },
        type: function(v) {
          return 'Must be a(n) ' + v.type + '.';
        }
      };

      function toErrorMessage(error) {
        if (!messages[error.name]) return 'Error: ' + error.name;
        return messages[error.name](error);
      }

      $scope.$watch('validationErrors', function(errors) {
        var path = ['fields', $scope.field.id, $scope.locale.code];
        var fieldErrors = _.filter(errors, function(error) {
          return _.isEqual(error.path, path);
        });
        $scope.errorMessages = fieldErrors.map(toErrorMessage);
      });
    }
  };
});
