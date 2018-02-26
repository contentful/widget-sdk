angular.module('contentful')
.directive('cfSidebarContentPreview', ['require', function (require) {
  var K = require('utils/kefir');
  var contentPreview = require('contentPreview');
  var Analytics = require('analytics/Analytics');
  var spaceContext = require('spaceContext');
  var $state = require('$state');

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
              // this function is asynchronous only because url may contain some
              // references to other entries, where the current one is linked, and
              // their resolution will take time. if you don't have any, then this
              // function will behave in a synchronous way, just returning `Promise.resolve(url)`
              contentPreview.replaceVariablesInUrl(
                environment.url, entry, $scope.entityInfo.contentType
              ).then(function (url) {
                environment.compiledUrl = url;
              });
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
          var contentTypeId = $scope.selectedEnvironment.contentType;
          var contentTypeName = _.get(
            spaceContext.publishedCTs.get(contentTypeId),
            'data.name',
            '<UNPUBLISHED CONTENT TYPE>'
          );
          var toState = $scope.selectedEnvironment.compiledUrl.replace(/\?.*$/, '');

          Analytics.track('element:click', {
            elementId: 'openContentPreviewBtn',
            groupId: 'entryEditor:contentPreview',
            fromState: $state.current.name,
            toState: toState,
            contentPreview: {
              previewName: $scope.selectedEnvironment.name,
              previewId: $scope.selectedEnvironment.envId,
              contentTypeName: contentTypeName,
              contentTypeId: contentTypeId
            }
          });
        }
      };
    }]
  };
}]);
