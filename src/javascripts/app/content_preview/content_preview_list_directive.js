'use strict';

angular.module('contentful')
.directive('cfContentPreviewList', [() => ({
  template: JST.content_preview_list(),
  restrict: 'E',
  controller: 'cfContentPreviewListController',
  scope: true
})])

.controller('cfContentPreviewListController', ['require', '$scope', (require, $scope) => {
  const contentPreview = require('contentPreview');

  contentPreview.getAll().then(environments => {
    $scope.previewEnvironments = mapList(environments);
    $scope.context.ready = true;
  });

  $scope.maxPreviewEnvironments = contentPreview.MAX_PREVIEW_ENVIRONMENTS;

  function mapList (environments) {
    return _.values(environments).map(env => ({
      id: env.sys.id,
      name: env.name,
      description: env.description
    }));
  }


  $scope.placeholderContentPreviewEnvironments = [
    {
      name: 'Main Website',
      description: 'Content preview for the main website'
    },
    {
      name: 'Landing Page',
      description: 'Content preview for the landing page'
    },
    {
      name: 'Event Page',
      description: 'Content preview for the event page'
    }
  ];
}]);
