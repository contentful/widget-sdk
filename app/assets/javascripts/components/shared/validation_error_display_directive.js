'use strict';

angular.module('contentful').directive('validationErrorDisplay', function () {
  return {
    restrict: 'C',
    template: JST['validation_error_display'],
    scope: true,
    link: function (scope, elem, attrs) {
      scope.$watch('errorMessages.length', function (numErrors) {
        if (0 < numErrors) {
          scope.noErrors = false;
          scope.hasErrors = true;
          if (attrs['ngHide'] || attrs['ngShow']) return;
          elem.show();
        } else {
          scope.noErrors = true;
          scope.hasErrors = false;
          if (attrs['ngHide'] || attrs['ngShow']) return;
          elem.hide();
        }
      });
    },
    controller: function ValidationErrorDisplayCtrl($scope, $attrs) {
      $scope.errorMessages = [];

      var messages = {
        linkContentType: function(v) {
          var ct = _.find($scope.spaceContext.publishedContentTypes, function(ct) {
            return ct.getId() === v.contentTypeId;
          });
          if (!ct) return 'Invalid Content Type';
          return 'Linked entry\'s Content Type must be ' + ct.getName() + '.';
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
          return 'Has an invalid format.';
        },
        'in': function (v) {
          return 'Must be one of ' + v.expected.join(', ') + '.';
        },
        required: function(v) {
          if (v.path.length == 1 && v.path[0] == 'fields') {
            return 'All fields are empty. Please fill out some fields.';
          } else {
            return 'Required';
          }
        },
        type: function(v) {
          if (v.type == 'Validation') {
            return v.details;
          } else if (v.type.match(/^aeio/i)) {
            return 'Must be an ' + v.type + '.';
          } else {
            return 'Must be a ' + v.type + '.';
          }
        }
      };

      function toErrorMessage(error) {
        if (!messages[error.name]) return 'Error: ' + error.name;
        return messages[error.name](error);
      }

      $scope.$watch('validationResult.errors', function(errors) {
        var path = $scope.$eval($attrs.path);
        var fieldErrors = _.filter(errors, function(error) {
          return _.isEqual(error.path, path);
        });
        $scope.errorMessages = fieldErrors.map(toErrorMessage);
      });
    }
  };
});
