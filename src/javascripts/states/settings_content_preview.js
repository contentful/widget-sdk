'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/contentPreview
 */
.factory('states/settings/content_preview', ['require', function (require) {
  var base = require('states/base');

  var list = base({
    name: 'list',
    url: '',
    ncyBreadcrumb: {
      label: 'Content preview'
    },
    loadingText: 'Loading content preview...',
    template: '<cf-content-preview-list class="workbench entity-list" />',
    controller: ['$scope', 'require', function ($scope, require) {
      var accessChecker = require('accessChecker');
      $scope.context = {};
      if (!accessChecker.getSectionVisibility().settings) {
        $scope.context.forbidden = true;
      }
    }]
  });

  var contentPreviewEditorState = base({
    template: '<cf-content-preview-editor class="workbench">',
    ncyBreadcrumb: {
      parent: 'spaces.detail.settings.content_preview.list',
      label: '{{context.title + (context.dirty ? "*" : "")}}'
    },
    loadingText: 'Loading content preview...',
    controller: ['$state', '$scope', 'contentPreview', function ($state, $scope, contentPreview) {
      $scope.context = $state.current.data;
      $scope.contentPreview = contentPreview;
    }]
  });

  var newContentPreview = _.extend({
    name: 'new',
    url: '/new',
    data: {
      isNew: true
    }
  }, contentPreviewEditorState);

  var detail = _.extend({
    name: 'detail',
    url: '/:contentPreviewId',
    data: {
      isNew: false
    }
  }, contentPreviewEditorState);

  return {
    name: 'content_preview',
    url: '/content_preview',
    abstract: true,
    template: '<ui-view />',
    children: [list, newContentPreview, detail]
  };
}]);
