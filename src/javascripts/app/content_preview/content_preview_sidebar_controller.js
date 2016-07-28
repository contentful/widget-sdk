'use strict';

angular.module('contentful')
.controller('contentPreviewSidebarController', ['$scope', '$injector',
function ($scope, $injector) {

  var contentPreview = $injector.get('contentPreview');
  var isAdmin = $injector.get('spaceContext')
    .getData('spaceMembership.admin', false);

  $scope.showDefaultMessage = false;

  contentPreview.getForContentType($scope.contentType)
  .then(function (environments) {
    $scope.contentPreviewEnvironments = environments;
    $scope.selectEnvironment($scope.contentPreviewEnvironments[0]);
    if (environments.length === 1 && environments[0].example && isAdmin) {
      $scope.showDefaultMessage = true;
    }

    updateUrls();
  });

  $scope.selectEnvironment = function (environment) {
    $scope.selectedEnvironment = environment;
  };

  // update urls when any field changes
  $scope.$watch(function () {
    return $scope.entry.data.fields;
  }, updateUrls);

  function updateUrls () {
    if ($scope.contentPreviewEnvironments) {
      $scope.contentPreviewEnvironments.forEach(function (environment) {
        environment.compiledUrl = contentPreview.replaceVariablesInUrl(
          environment.url, $scope.entry, $scope.contentType
        );
      });
    }
  }
}]);
