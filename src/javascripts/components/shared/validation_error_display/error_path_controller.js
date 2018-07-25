'use strict';

angular.module('contentful')
.controller('ErrorPathController', ['$scope', '$attrs', 'require',
function ErrorPathController($scope, $attrs, require) {
  const controller = this;
  const logger = require('logger');

  controller.messages = [];

  $scope.$watch('validationResult.errors', errors => {
    const pathPattern = $scope.$eval($attrs.cfErrorPath);

    const fieldErrors = _.filter(errors, error => {
      try {
        return matchesPath(pathPattern, error.path);
      } catch (e) {
        // TODO We have seen `matchesPath` throw on bugsnag. This is
        // some temporary logging to gather some data.
        logger.logError('Cannot match validation result', {
          error: e,
          data: {
            errorPathPattern: pathPattern,
            validationErrors: errors
          }
        });
      }
    });

    const hasErrors = fieldErrors.length > 0;

    controller.messages = _.map(fieldErrors, 'message');
    controller.hasErrors = hasErrors;
    controller.isEmpty = !hasErrors;
  });

  function matchesPath (pattern, target) {
    const prefixLen = pattern.length - 1;
    if (pattern[prefixLen] === '*') {
      target = target.slice(0, prefixLen);
      pattern = pattern.slice(0, prefixLen);
    }
    return _.isEqual(target, pattern);
  }

}]);
