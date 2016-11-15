'use strict';

angular.module('contentful')
.controller('contentPreviewSidebarController', ['$scope', '$injector', function ($scope, $injector) {
  var contentPreview = $injector.get('contentPreview');
  var analytics = $injector.get('analytics');
  var isAdmin = $injector.get('spaceContext')
    .getData('spaceMembership.admin', false);

  $scope.showDefaultMessage = false;

  contentPreview.getForContentType($scope.contentType)
  .then(function (environments) {
    $scope.contentPreviewEnvironments = environments;

    var selectedEnvironmentId = contentPreview.getSelected($scope.entry.getContentTypeId());
    var selectedEnvironment = _.find(environments, { 'envId': selectedEnvironmentId });

    $scope.selectedEnvironment = selectedEnvironment || environments[0];

    if (environments.length === 1 && environments[0].example && isAdmin) {
      $scope.showDefaultMessage = true;
    }

    updateUrls();
  });

  $scope.selectEnvironment = function (environment) {
    $scope.selectedEnvironment = environment;
    contentPreview.setSelected(environment);
  };

  $scope.trackClickedLink = function () {
    analytics.track('entry_editor:preview_opened', {
      envName: $scope.selectedEnvironment.name,
      envId: $scope.selectedEnvironment.envId,
      previewUrl: $scope.selectedEnvironment.url,
      entryId: $scope.entity.getId()
    });
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
