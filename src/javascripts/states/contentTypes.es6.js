import contextHistory from 'navigation/Breadcrumbs/History.es6';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';
import base from 'states/Base.es6';
import { getOrgFeature } from 'data/CMA/ProductCatalog.es6';
import * as WidgetStore from 'widgets/WidgetStore.es6';
import * as EditorInterfaceTransformer from 'widgets/EditorInterfaceTransformer.es6';

const list = base({
  name: 'list',
  url: '',
  template: '<react-component name="components/tabs/content_type_list/ContentTypeListPage.es6" />',
  controller: [
    '$scope',
    $scope => {
      $scope.context.ready = true;
    }
  ]
});

const fields = {
  name: 'fields',
  url: '/fields',
  params: {
    ignoreLeaveConfirmation: true
  }
};

const preview = {
  name: 'preview',
  url: '/preview',
  params: {
    ignoreLeaveConfirmation: true
  }
};

const sidebarConfiguration = {
  name: 'sidebar_configuration',
  url: '/sidebar_configuration',
  params: {
    ignoreLeaveConfirmation: true
  }
};

const widgetResolvers = {
  widgets: [
    'spaceContext',
    spaceContext => {
      return WidgetStore.getForContentTypeManagement(
        spaceContext.getId(),
        spaceContext.getEnvironmentId()
      );
    }
  ],
  editorInterface: [
    'spaceContext',
    'contentType',
    'widgets',
    async (spaceContext, contentType, widgets) => {
      const ct = contentType.data;
      const ei = await spaceContext.cma.getEditorInterface(ct.sys.id);
      return EditorInterfaceTransformer.fromAPI(ct, ei, widgets);
    }
  ],
  hasCustomSidebarFeature: [
    'spaceContext',
    spaceContext => {
      return getOrgFeature(spaceContext.organization.sys.id, 'custom_sidebar', true);
    }
  ]
};

const existingContentTypeIdsResolver = {
  contentTypeIds: [
    'spaceContext',
    async spaceContext => {
      const contentTypes = await spaceContext.cma.getContentTypes();
      return contentTypes.items.map(ct => ct.sys.id);
    }
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
      ...widgetResolvers,
      ...existingContentTypeIdsResolver
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
      ...widgetResolvers,
      ...existingContentTypeIdsResolver
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
    children: [fields, preview, sidebarConfiguration],
    controller: [
      '$scope',
      '$stateParams',
      'contentType',
      'widgets',
      'editorInterface',
      'publishedContentType',
      'contentTypeIds',
      'hasCustomSidebarFeature',
      (
        $scope,
        $stateParams,
        contentType,
        widgets,
        editorInterface,
        publishedContentType,
        contentTypeIds,
        hasCustomSidebarFeature
      ) => {
        $scope.context.isNew = isNew;
        $scope.contentType = contentType;
        $scope.widgets = widgets;
        $scope.editorInterface = editorInterface;
        $scope.publishedContentType = publishedContentType;
        $scope.contentTypeIds = contentTypeIds;
        $scope.hasCustomSidebarFeature = hasCustomSidebarFeature;

        contextHistory.set([
          crumbFactory.ContentTypeList(),
          crumbFactory.ContentType($stateParams.contentTypeId, $scope.context)
        ]);
      }
    ],
    template:
      '<div cf-content-type-editor class="workbench" cf-validate="contentType.data" cf-content-type-schema></div>',
    ...options
  };
}
