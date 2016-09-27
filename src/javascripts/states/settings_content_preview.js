'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states/settings/contentPreview
 */
.factory('states/settings/content_preview', ['require', function (require) {
  var base = require('states/base');
  var contextHistory = require('contextHistory');

  var listEntity = {
    getTitle: function () { return list.label; },
    link: { state: 'spaces.detail.settings.content_preview.list' },
    getType: _.constant('PreviewEnvironments'),
    getId: _.constant('PREVIEWENVIRONMENTS')
  };

  var list = base({
    name: 'list',
    url: '',
    label: 'Content Preview',
    loadingText: 'Loading content preview...',
    template: '<cf-content-preview-list class="workbench entity-list" />',
    controller: ['$scope', 'require', function ($scope, require) {
      var accessChecker = require('accessChecker');

      $scope.context = {};
      if (!accessChecker.getSectionVisibility().settings) {
        $scope.context.forbidden = true;
      }

      // add list view as top state
      contextHistory.addEntity(listEntity);
    }]
  });

  function editorBase (options) {
    var contentPreviewEditorState = base({
      template: '<cf-content-preview-editor class="workbench">',
      label: 'context.title + (context.dirty ? "*" : "")',
      params: { addToContext: true },
      loadingText: 'Loading content preview...',
      controller: ['require', '$scope', 'contentPreview', function (require, $scope, contentPreview) {
        var $state = require('$state');
        var $stateParams = require('$stateParams');

        var isNew = options.data.isNew;
        var contentPreviewId = $stateParams.contentPreviewId;
        var state = 'spaces.detail.settings.content_preview.';
        var params = isNew ? {} : { contentPreviewId: contentPreviewId };
        var id = isNew ? 'PREVIEWENVIRONMENTNEW' : contentPreviewId;

        state += isNew ? 'new' : 'detail';

        $scope.context = $state.current.data;
        $scope.contentPreview = contentPreview;

        // add list view as parent
        contextHistory.addEntity(listEntity);

        // add current view as child
        contextHistory.addEntity({
          getTitle: function () { return $scope.$eval(contentPreviewEditorState.label); },
          link: {
            state: state,
            params: params
          },
          getType: _.constant('PreviewEnvironment'),
          getId: _.constant(id)
        });
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
