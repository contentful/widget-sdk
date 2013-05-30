'use strict';

angular.module('contentful').directive('cfValidate', function () {
  return {
    restrict: 'A',
    controller: function ($scope, $attrs) {

      $scope.$watch(getSchema, function (schema) {
        var data = getData();
        validate(data, schema);
      });

      $scope.$watch(getData, function(data) {
        var schema = getSchema();
        validate(data, schema);
      }, true);

      function getSchema() {
        return $scope.$eval($attrs.withSchema);
      }

      function getData() {
        var entity = $scope.$eval($attrs.cfValidate);
        if (entity) return entity.data;
      }

      function validate(data, schema){
        if (!data || !schema) return;
        var errors = schema.errors(_.omit(data, 'sys'));
        $scope.entityErrors = errors;
        $scope.entityValid = _.isEmpty(errors);
      }

    }
  };
});
