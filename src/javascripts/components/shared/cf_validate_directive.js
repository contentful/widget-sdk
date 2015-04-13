'use strict';

angular.module('contentful').directive('cfValidate', [function () {
  return {
    restrict: 'A',
    scope: true,
    controller: 'ValidationController'
  };
}]);

angular.module('contentful')
.controller('ValidationController', ['$injector', '$scope', '$attrs',
function ValidationController ($injector, $scope, $attrs) {
  $scope.validationResult = {};

  $scope.validate = function () {
    validate(getData(), $scope.schema);
    return $scope.validationResult.valid;
  };

  function getData() {
    return $scope.$eval($attrs.cfValidate);
  }

  function validate(data, schema){
    if(!data || !schema) return;
    if(!data.fields) data.fields = {};
    var schemaErrors = schema.errors(data);
    $scope.setValidationResult(schemaErrors, data, schema);
  }

  function pathErrors(errors) {
    var retval = {};
    _.each(errors, function (error) {
      var pointer = retval;
      for (var i = 0, l = error.path.length; i < l; i ++) {
        var pathSeg = error.path[i];
        pointer = pointer[pathSeg] = pointer[pathSeg] || {};
      }
    });
    return retval;
  }

  $scope.setValidationResult = function (schemaErrors, data, schema) {
    var errors = _.filter(schemaErrors, function (error) {
      if (error && error.path) {
        return error.path[error.path.length - 1] != '$$hashKey';
      } else {
        return true;
      }
    });

    errors = _.forEach(errors, function (error) {
      error.message = schema.buildMessage(error, data);
    });

    var valid = _.isEmpty(errors);
    $scope.validationResult = {
      data: data,
      schema: schema,
      errors: errors,
      valid:  valid,
      pathErrors: pathErrors(errors)
    };
  };

  $scope.setValidationErrors = function (schemaErrors) {
    $scope.setValidationResult(schemaErrors, getData(), $scope.schema);
  };

  $scope.$on('$destroy', function (event) {
    var scope = event.currentScope;
    scope.validationResult = {};
  });

}]);
