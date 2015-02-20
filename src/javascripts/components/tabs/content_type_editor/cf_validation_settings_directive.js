'use strict';
angular.module('contentful').directive('cfValidationSetting', ['$injector', function ($injector) {
  var mimetype        = $injector.get('mimetype');
  var validationViews = $injector.get('validationViews');

  return {
    restrict: 'E',
    template: JST['cf_validation_settings'](),
    controller: ['$scope', function($scope) {
      $scope.mimetypeGroups = mimetype.getGroupNames();

      $scope.validation.currentView = validationViews.getInitial($scope.validation);
      $scope.$watch('validation.currentView', function() {
        validationViews.updateSettings($scope.validation);
      });
    }]
  };
}]);
