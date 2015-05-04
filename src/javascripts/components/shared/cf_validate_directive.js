'use strict';

/**
 * @ngdoc directive
 * @name cfValidate
 *
 * @property {Error[]}  $scope.validationResult.errors
 * @property {boolean} $scope.validationResult.valid
 *
 * @scope.requires  schema.errors
 * @scope.requires  schema.buildMessage
 */
angular.module('contentful').directive('cfValidate', [function () {
  return {
    restrict: 'A',
    scope: true,
    controller: 'ValidationController',
    controllerAs: 'validator'
  };
}]);

angular.module('contentful')
.controller('ValidationController', ['$scope', '$attrs', 'logger',
function ValidationController ($scope, $attrs, logger) {
  var controller = this;

  $scope.validationResult = {};

  /**
   * @ngdoc method
   * @name cfValidate#$scope.validate
   * @description
   * Validates the data and updates `$scope.validationResult`.
   */
  $scope.validate = function () {
    var data = getData();
    var schema = $scope.schema;
    var errors = schema.errors(data);

    if (!_.isUndefined(errors))
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

  /**
   * @ngdoc method
   * @name cfValidate#validator.getPathErrors
   *
   * @param {string} path
   * @returns {Array<Error>}
   */
  controller.getPathErrors = function (path) {
    var errors = $scope.validationResult.errors;
    return _.filter(errors, function(error) {
      return matchesPath(path, error.path);
    });
  };


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

    if (schema.buildMessage) {
      errors = _.forEach(errors, function (error) {
        error.message = schema.buildMessage(error);
      });
    }

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
      try {
        for (var i = 0, l = error.path.length; i < l; i ++) {
          var pathSeg = error.path[i];
          pointer = pointer[pathSeg] = pointer[pathSeg] || {};
        }
      } catch (exp) {
        logger.logError('Error path exception', {
          data: {
            error: error,
            path: error.path
          }
        });
      }
    });
    return retval;
  }

  function matchesPath(pattern, target) {
    var prefixLen = pattern.length - 1;
    if (pattern[prefixLen] === '*') {
      return _.isEqual(target.slice(0, prefixLen), pattern.slice(0, prefixLen));
    } else {
      return _.isEqual(target, pattern);
    }
  }
}]);
