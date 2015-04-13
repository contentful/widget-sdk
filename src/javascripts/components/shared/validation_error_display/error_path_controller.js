'use strict';

angular.module('contentful')
.controller('ErrorPathController', ['$scope', '$attrs',
function ErrorPathController($scope, $attrs) {
  var controller = this;

  controller.messages = [];

  function matchesPath(pattern, target) {
    var prefixLen = pattern.length - 1;
    if (pattern[prefixLen] === '*') {
      return _.isEqual(target.slice(0, prefixLen), pattern.slice(0, prefixLen));
    } else {
      return _.isEqual(target, pattern);
    }
  }

  var unwatchValidationErrors = $scope.$watch('validationResult.errors', function(errors) {
    var pathPattern = $scope.$eval($attrs.cfErrorPath);

    var fieldErrors = _.filter(errors, function(error) {
      return matchesPath(pathPattern, error.path);
    });

    var hasErrors = fieldErrors.length > 0;

    controller.messages = _.map(fieldErrors, 'message');
    controller.hasErrors = hasErrors;
    controller.isEmpty = !hasErrors;
  });

  $scope.$on('$destroy', function () {
    unwatchValidationErrors();
    unwatchValidationErrors = null;
  });

}]);
