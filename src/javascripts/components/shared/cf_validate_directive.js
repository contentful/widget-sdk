'use strict';

/**
 * @ngdoc directive
 * @name cfValidate
 * @controller ValidationController
 */
angular.module('contentful').directive('cfValidate', [function () {
  return {
    restrict: 'A',
    scope: true,
    controller: 'ValidationController'
  };
}]);

angular.module('contentful')
.controller('ValidationController', ['$scope', '$attrs',
function ValidationController ($scope, $attrs) {

  $scope.validationResult = {};

  /**
   * @ngdoc method
   * @name cfValidate#validate
   */
  $scope.validate = function () {
    var data = getData();
    var schema = $scope.schema;
    var errors;
    try {
      errors = schema.errors(data);
    } catch(e) {
      errors = null;
    }

    if (errors)
      $scope.setValidationErrors(errors);
    return $scope.validationResult.valid;
  };

  $scope.setValidationErrors = function (errors) {
    $scope.validationResult = makeValidationResult(errors, getData(), $scope.schema);
  };

  $scope.$on('$destroy', function (event) {
    var scope = event.currentScope;
    scope.validationResult = {};
  });


  function getData() {
    return $scope.$eval($attrs.cfValidate);
  }

  function makeValidationResult (errors, data, schema) {
    errors = _.filter(errors, function (error) {
      if (error && error.path) {
        return error.path[error.path.length - 1] != '$$hashKey';
      } else {
        return true;
      }
    });

    errors = _.forEach(errors, function (error) {
      error.message = schema.buildMessage(error);
    });

    var valid = _.isEmpty(errors);
    return {
      data: data,
      schema: schema,
      errors: errors,
      valid:  valid,
      pathErrors: pathErrors(errors)
    };
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
}]);
