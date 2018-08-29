'use strict';
angular.module('contentful').directive('cfValidationSetting', [
  'require',
  require => {
    const mimetype = require('mimetype');
    const validationViews = require('validationViews');

    return {
      scope: true,
      restrict: 'E',
      template: JST['cf_validation_settings'](),
      controller: [
        '$scope',
        $scope => {
          $scope.mimetypeGroups = mimetype.getGroupNames();

          $scope.$watch('validation.currentView', () => {
            validationViews.updateSettings($scope.validation);
          });

          $scope.setMatchingView = () => {
            $scope.validation.currentView = validationViews.getInitial($scope.validation);
          };
          $scope.setMatchingView();

          $scope.$watch('validation.enabled', isEnabled => {
            if (!isEnabled) {
              $scope.validate();
            }
          });
        }
      ]
    };
  }
]);
