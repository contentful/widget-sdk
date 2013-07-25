'use strict';

angular.module('contentful').directive('cfValidate', function (validation) {
  return {
    restrict: 'A',
    scope: true,
    controller: function ($scope, $attrs) {
      $scope.validationResult = {};

      if (!angular.isDefined($attrs.validateManually)) {
        $scope.$watch(getSchema, function (schema) {
          var data = getData();
          validate(data, schema);
        });

        $scope.$watch(getData, function(data) {
          var schema = getSchema();
          validate(data, schema);
        }, true);
      }

      $scope.validate = function () {
        validate(getData(), getSchema());
        return $scope.validationResult.valid;
      };

      function getSchema() {
        if ('withSchema' in $attrs) {
          return $scope.$eval($attrs.withSchema);
        } else {
          var data = getData();
          switch (data && data.sys && data.sys.type) {
            case 'ContentType':
              return validation.schemas.ContentType;
            case 'Asset':
              throw new Error('Validating Assets requires passing a schema in the "withSchema"-attribute.');
            case 'Entry':
              throw new Error('Validating Entries requires passing a schema in the "withSchema"-attribute.');
            default:
              return null;
          }
        }
      }

      function getData() {
        return $scope.$eval($attrs.cfValidate);
      }

      function validate(data, schema){
        if (!data || !schema) return;
        var schemaErrors = schema.errors(data);
        $scope.setValidationResult(schemaErrors, data, schema);
      }

      $scope.setValidationResult = function (schemaErrors, data, schema) {
        var errors = _.reject(schemaErrors, function (error) {
          return error.path[error.path.length-1] == '$$hashKey';
        });
        var valid = _.isEmpty(errors);
        $scope.validationResult = {
          data: data,
          schema: schema,
          errors: errors,
          valid:  valid
        };
        
      };

      $scope.$on('$destroy', function (event) {
        var scope = event.currentScope;
        scope.validationResult = {};
      });

    }
  };
});
