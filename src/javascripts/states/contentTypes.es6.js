import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';
import base from 'states/Base.es6';

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
      editingInterface: [
        'spaceContext',
        'contentType',
        (spaceContext, contentType) => spaceContext.eiRepo.get(contentType.data)
      ],
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
        'spaceContext',
        ($stateParams, spaceContext) =>
          spaceContext.space.getContentType($stateParams.contentTypeId)
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
      editingInterface: [
        'spaceContext',
        'contentType',
        (spaceContext, contentType) => spaceContext.eiRepo.get(contentType.data)
      ]
    }
  },
  false
);

export default {
  name: 'content_types',
  url: '/content_types',
  abstract: true,
  children: [list, newState, detail]
};

function editorBase(options, isNew) {
  return {
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
      '></div>',
    ...options
  };
}
