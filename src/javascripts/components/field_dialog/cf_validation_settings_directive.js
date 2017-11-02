'use strict';
angular.module('contentful').directive('cfValidationSetting', ['require', function (require) {
  var mimetype        = require('mimetype');
  var validationViews = require('validationViews');

  return {
    scope: true,
    restrict: 'E',
    template: JST['cf_validation_settings'](),
    controller: ['$scope', function($scope) {
      $scope.mimetypeGroups = mimetype.getGroupNames();

      $scope.$watch('validation.currentView', function() {
        validationViews.updateSettings($scope.validation);
      });

      $scope.setMatchingView = function() {
        $scope.validation.currentView = validationViews.getInitial($scope.validation);
      };
      $scope.setMatchingView();

      $scope.$watch('validation.enabled', function (isEnabled) {
        if (!isEnabled)
          $scope.validate();
      });
    }]
  };
}]);
