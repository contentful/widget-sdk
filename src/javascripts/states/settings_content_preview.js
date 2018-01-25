'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/contentPreview
 */
.factory('states/settings/content_preview', ['require', function (require) {
  var base = require('states/Base').default;
  var contextHistory = require('contextHistory');
  var crumbFactory = require('navigation/CrumbFactory');

  var list = base({
    name: 'list',
    url: '',
    loadingText: 'Loading content preview…',
    template: '<cf-content-preview-list class="workbench entity-list" />',
    controller: ['$scope', 'require', function ($scope, require) {
      var accessChecker = require('access_control/AccessChecker');
      $scope.context.forbidden = !accessChecker.getSectionVisibility().settings;
    }]
  });

  function editorBase (options) {
    var contentPreviewEditorState = base({
      template: '<cf-content-preview-editor class="workbench">',
      loadingText: 'Loading content preview…',
      controller: ['$scope', '$stateParams', 'contentPreview', function ($scope, $stateParams, contentPreview) {
        $scope.contentPreview = contentPreview;

        contextHistory.set([
          crumbFactory.PreviewEnvList(),
          crumbFactory.PreviewEnv($stateParams.contentPreviewId, $scope.context)
        ]);
      }]
    });

    return _.extend(options, contentPreviewEditorState);
  }

  var newContentPreview = editorBase({
    name: 'new',
    url: '/new',
    data: {
      isNew: true
    }
  });

  var detail = editorBase({
    name: 'detail',
    url: '/:contentPreviewId',
    data: {
      isNew: false
    }
  });

  return {
    name: 'content_preview',
    url: '/content_preview',
    abstract: true,
    children: [list, newContentPreview, detail]
  };
}]);
