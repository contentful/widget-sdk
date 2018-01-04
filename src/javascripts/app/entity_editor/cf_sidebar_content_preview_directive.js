angular.module('contentful')
.directive('cfSidebarContentPreview', ['require', function (require) {
  var K = require('utils/kefir');
  var contentPreview = require('contentPreview');
  var Analytics = require('analytics/Analytics');
  var spaceContext = require('spaceContext');
  return {
    restrict: 'E',
    scope: true,
    template: JST.cf_sidebar_content_preview(),
    controller: ['$scope', function ($scope) {
      var isAdmin = spaceContext.getData('spaceMembership.admin', false);

      $scope.isAdmin = isAdmin;
      $scope.isPreviewSetup = false;

      contentPreview.getForContentType($scope.entityInfo.contentTypeId)
        .then(function (environments) {
          $scope.contentPreviewEnvironments = environments;

          var selectedEnvironmentId = contentPreview.getSelected($scope.entityInfo.contentTypeId);
          var selectedEnvironment = _.find(environments, { 'envId': selectedEnvironmentId });

          $scope.selectedEnvironment = selectedEnvironment || environments[0];

          K.onValueScope($scope, $scope.otDoc.data$, function (entry) {
            $scope.contentPreviewEnvironments.forEach(function (environment) {
              environment.compiledUrl = contentPreview.replaceVariablesInUrl(
                environment.url, entry, $scope.entityInfo.contentType
              );
            });
          });

          $scope.isPreviewSetup = $scope.contentPreviewEnvironments && $scope.contentPreviewEnvironments.length;
        });

      $scope.selectEnvironment = function (environment) {
        $scope.selectedEnvironment = environment;
        contentPreview.setSelected(environment);
      };

      $scope.trackClickedLink = function () {
        if ($scope.isPreviewSetup) {
          Analytics.track('entry_editor:preview_opened', {
            envName: $scope.selectedEnvironment.name,
            envId: $scope.selectedEnvironment.envId,
            previewUrl: $scope.selectedEnvironment.url,
            entryId: $scope.entityInfo.id
          });
        }
      };
    }]
  };
}]);
