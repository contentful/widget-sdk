'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name states/settings/contentPreview
   */
  .factory('states/settings/content_preview', [
    'require',
    require => {
      var base = require('states/Base.es6').default;
      var contextHistory = require('navigation/Breadcrumbs/History.es6').default;
      var crumbFactory = require('navigation/Breadcrumbs/Factory.es6');

      var list = base({
        name: 'list',
        url: '',
        loadingText: 'Loading content preview…',
        template: '<cf-content-preview-list class="workbench entity-list" />',
        controller: [
          '$scope',
          'require',
          ($scope, require) => {
            var accessChecker = require('access_control/AccessChecker');
            $scope.context.forbidden = !accessChecker.getSectionVisibility().settings;
          }
        ]
      });

      function editorBase(options, isNew) {
        var contentPreviewEditorState = base({
          template: '<cf-content-preview-editor class="workbench">',
          loadingText: 'Loading content preview…',
          controller: [
            '$scope',
            '$stateParams',
            'contentPreview',
            ($scope, $stateParams, contentPreview) => {
              $scope.context.isNew = isNew;
              $scope.contentPreview = contentPreview;

              contextHistory.set([
                crumbFactory.PreviewEnvList(),
                crumbFactory.PreviewEnv($stateParams.contentPreviewId, $scope.context)
              ]);
            }
          ]
        });

        return _.extend(options, contentPreviewEditorState);
      }

      var newContentPreview = editorBase(
        {
          name: 'new',
          url: '/new'
        },
        true
      );

      var detail = editorBase(
        {
          name: 'detail',
          url: '/:contentPreviewId'
        },
        false
      );

      return {
        name: 'content_preview',
        url: '/content_preview',
        abstract: true,
        children: [list, newContentPreview, detail]
      };
    }
  ]);
