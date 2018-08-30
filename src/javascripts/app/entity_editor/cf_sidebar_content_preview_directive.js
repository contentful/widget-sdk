angular.module('contentful').directive('cfSidebarContentPreview', [
  'require',
  require => {
    const K = require('utils/kefir.es6');
    const contentPreview = require('contentPreview');
    const Analytics = require('analytics/Analytics.es6');
    const spaceContext = require('spaceContext');
    const $state = require('$state');

    return {
      restrict: 'E',
      scope: true,
      template: JST.cf_sidebar_content_preview(),
      controller: [
        '$scope',
        $scope => {
          const isAdmin = spaceContext.getData('spaceMembership.admin', false);

          $scope.isAdmin = isAdmin;
          $scope.isPreviewSetup = false;

          contentPreview.getForContentType($scope.entityInfo.contentTypeId).then(environments => {
            $scope.contentPreviewEnvironments = environments;

            const selectedEnvironmentId = contentPreview.getSelected(
              $scope.entityInfo.contentTypeId
            );
            const selectedEnvironment = _.find(environments, { envId: selectedEnvironmentId });

            $scope.selectedEnvironment = selectedEnvironment || environments[0];

            K.onValueScope($scope, $scope.otDoc.data$, entry => {
              $scope.contentPreviewEnvironments.forEach(environment => {
                // this function is asynchronous only because url may contain some
                // references to other entries, where the current one is linked, and
                // their resolution will take time. if you don't have any, then this
                // function will behave in a synchronous way, just returning `Promise.resolve(url)`
                contentPreview
                  .replaceVariablesInUrl(environment.url, entry, $scope.entityInfo.contentType)
                  .then(url => {
                    environment.compiledUrl = url;
                  });
              });
            });

            $scope.isPreviewSetup =
              $scope.contentPreviewEnvironments && $scope.contentPreviewEnvironments.length;
          });

          $scope.selectEnvironment = environment => {
            $scope.selectedEnvironment = environment;
            contentPreview.setSelected(environment);
          };

          $scope.trackClickedLink = () => {
            // compiledUrl is assigned its value asynchronously, that's why we need to check if it's defined
            if ($scope.isPreviewSetup && $scope.selectedEnvironment.compiledUrl) {
              const contentTypeId = $scope.selectedEnvironment.contentType;
              const contentTypeName = _.get(
                spaceContext.publishedCTs.get(contentTypeId),
                'data.name',
                '<UNPUBLISHED CONTENT TYPE>'
              );
              const toState = $scope.selectedEnvironment.compiledUrl.replace(/\?.*$/, '');

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
        }
      ]
    };
  }
]);
