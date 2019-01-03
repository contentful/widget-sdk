import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';
import base from 'states/Base.es6';

/**
 * @ngdoc service
 * @name states/contentTypes
 */
registerFactory('states/contentTypes', [
  'states/resolvers',
  resolvers => {
    const list = base({
      name: 'list',
      url: '',
      loadingText: 'Loading content model…',
      template: '<div cf-content-type-list class="workbench entity-list"></div>'
    });

    const fields = {
      name: 'fields',
      url: '/fields',
      params: {
        addToContext: true
      }
    };

    const preview = {
      name: 'preview',
      url: '/preview',
      params: {
        addToContext: true
      }
    };

    const newState = editorBase(
      {
        name: 'new',
        url: '_new',
        resolve: {
          contentType: [
            'spaceContext',
            spaceContext =>
              spaceContext.space.newContentType({ sys: { type: 'ContentType' }, fields: [] })
          ],
          editingInterface: resolvers.editingInterface,
          publishedContentType: [() => null]
        }
      },
      true
    );

    const detail = editorBase(
      {
        name: 'detail',
        url: '/:contentTypeId',
        resolve: {
          contentType: [
            '$stateParams',
            'data/ContentTypes',
            'spaceContext',
            ($stateParams, ctHelpers, spaceContext) => {
              const space = spaceContext.space;
              return space.getContentType($stateParams.contentTypeId).then(ct => {
                // Some legacy content types do not have a name. If it is
                // missing we set it to 'Untitled' so we can display
                // something in the UI. Note that the API requires new
                // Content Types to have a name.
                ctHelpers.assureName(ct.data);
                return ct;
              });
            }
          ],
          publishedContentType: [
            'contentType',
            contentType =>
              contentType.getPublishedStatus().catch(err => {
                if (err.statusCode === 404) {
                  return null;
                } else {
                  throw err;
                }
              })
          ],
          editingInterface: resolvers.editingInterface
        }
      },
      false
    );

    return {
      name: 'content_types',
      url: '/content_types',
      abstract: true,
      children: [list, newState, detail]
    };

    function editorBase(options, isNew) {
      return _.extend(
        {
          redirectTo: '.fields',
          children: [fields, preview],
          controller: [
            '$scope',
            '$stateParams',
            'contentType',
            'editingInterface',
            'publishedContentType',
            ($scope, $stateParams, contentType, editingInterface, publishedContentType) => {
              $scope.context.isNew = isNew;
              $scope.contentType = contentType;
              $scope.editingInterface = editingInterface;
              $scope.publishedContentType = publishedContentType;

              contextHistory.set([
                crumbFactory.ContentTypeList(),
                crumbFactory.ContentType($stateParams.contentTypeId, $scope.context)
              ]);
            }
          ],
          template:
            '<div ' +
            [
              'cf-content-type-editor',
              'class="workbench"',
              'cf-validate="contentType.data" cf-content-type-schema',
              'cf-ui-tab'
            ].join(' ') +
            '></div>'
        },
        options
      );
    }
  }
]);
