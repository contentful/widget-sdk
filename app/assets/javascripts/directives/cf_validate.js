'use strict';

angular.module('contentful').directive('cfValidate', function (validation) {
  return {
    restrict: 'A',
    scope: true,
    controller: function ($scope, $attrs) {
      $scope.validationResult = {};

      $scope.$watch(getSchema, function (schema) {
        var data = getData();
        validate(data, schema);
      });

      $scope.$watch(getData, function(data) {
        var schema = getSchema();
        validate(data, schema);
      }, true);

      function getSchema() {
        if ('withSchema' in $attrs) {
          return $scope.$eval($attrs.withSchema);
        } else {
          var data = getData();
          switch (data && data.sys && data.sys.type) {
            case 'ContentType':
              return validation.schemas.ContentType;
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
        var schemaErrors = schema.errors(_.omit(data, 'sys'));
        var errors = _.reject(schemaErrors, function (error) {
          return error.path[error.path.length-1] == '$$hashKey';
        });
        var valid = _.isEmpty(errors);
        $scope.validationResult = {
          // Only for debugging:
          //data: data,
          //schema: schema,
          errors: errors,
          valid:  valid
        };
      }

    }
  };
});
