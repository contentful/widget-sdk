'use strict';

angular.module('contentful')
.directive('cfContentPreviewList', [function () {
  return {
    template: JST.content_preview_list(),
    restrict: 'E',
    controller: 'cfContentPreviewListController',
    scope: true
  };
}])

.controller('cfContentPreviewListController', ['require', '$scope', function (require, $scope) {
  var contentPreview = require('contentPreview');

  contentPreview.getAll().then(function (environments) {
    $scope.previewEnvironments = mapList(environments);
    $scope.context.ready = true;
  });

  function mapList (environments) {
    return _.values(environments).map(function (env) {
      return {
        id: env.sys.id,
        name: env.name,
        description: env.description
      };
    });
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
