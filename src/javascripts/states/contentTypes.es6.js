import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';
import base from 'states/Base.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';

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

const widgetResolvers = {
  widgets: ['spaceContext', spaceContext => spaceContext.widgets.refresh()],
  editorInterface: [
    'spaceContext',
    'contentType',
    // We declare dependency on `widgets` so Editor Interface is fetched only after the refresh.
    'widgets',
    (spaceContext, contentType, _widgets) => spaceContext.editorInterfaceRepo.get(contentType.data)
  ],
  hasCustomSidebarFeature: [
    'spaceContext',
    spaceContext => getOrgFeature(spaceContext.organization.sys.id, 'custom_sidebar', true)
  ]
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
      publishedContentType: [() => null],
      ...widgetResolvers
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
      ...widgetResolvers
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
      'widgets',
      'editorInterface',
      'publishedContentType',
      'hasCustomSidebarFeature',
      (
        $scope,
        $stateParams,
        contentType,
        widgets,
        editorInterface,
        publishedContentType,
        hasCustomSidebarFeature
      ) => {
        $scope.context.isNew = isNew;
        $scope.contentType = contentType;
        $scope.widgets = widgets;
        $scope.editorInterface = editorInterface;
        $scope.publishedContentType = publishedContentType;
        $scope.hasCustomSidebarFeature = hasCustomSidebarFeature;

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
