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
      const _ = require('lodash');
      const base = require('states/Base.es6').default;
      const contextHistory = require('navigation/Breadcrumbs/History.es6').default;
      const crumbFactory = require('navigation/Breadcrumbs/Factory.es6');

      function editorBase(options, isNew) {
        const contentPreviewEditorState = base({
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

      const newContentPreview = editorBase(
        {
          name: 'new',
          url: '/new'
        },
        true
      );

      const detail = editorBase(
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
        children: [
          {
            name: 'list',
            url: '',
            template:
              '<react-component name="app/settings/content_preview/routes/ContentPreviewListRoute.es6" />'
          },
          newContentPreview,
          detail
        ]
      };
    }
  ]);
