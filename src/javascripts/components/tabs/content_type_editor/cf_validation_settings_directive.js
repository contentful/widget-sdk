'use strict';
angular.module('contentful').directive('cfValidationSetting', ['$injector', function ($injector) {
  var mimetype = $injector.get('mimetype');

  return {
    restrict: 'E',
    template: JST['cf_validation_settings'](),
    controller: ['$scope', function($scope) {
      $scope.mimetypeGroups = mimetype.getGroupNames();
    }]
  };
}]);
