import * as EditorInterfaceTransformer from 'widgets/EditorInterfaceTransformer';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { ContentTypesPage } from 'components/tabs/content_type_list/ContentTypesPage';
import { toLegacyWidget } from 'widgets/WidgetCompat';

const list = {
  name: 'list',
  url: '',
  component: ContentTypesPage,
};

const fields = {
  name: 'fields',
  url: '/fields',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const preview = {
  name: 'preview',
  url: '/preview',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const sidebarConfiguration = {
  name: 'sidebar_configuration',
  url: '/sidebar_configuration',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const entryEditorConfiguration = {
  name: 'entry_editor_configuration',
  url: '/entry_editor_configuration',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const widgetResolvers = {
  customWidgets: [
    // Define dependency on spaceContext so we get custom widgets
    // only when the space is initialized.
    'spaceContext',
    async () => {
      const loader = await getCustomWidgetLoader();
      const widgets = await loader.getUncachedForListing();

      return widgets.map(toLegacyWidget);
    },
  ],
  editorInterface: [
    'spaceContext',
    'contentType',
    async (spaceContext, contentType) => {
      const ct = contentType.data;
      const ei = await spaceContext.cma.getEditorInterface(ct.sys.id);
      return EditorInterfaceTransformer.fromAPI(ct, ei);
    },
  ],
  hasAdvancedExtensibility: [
    'spaceContext',
    (spaceContext) => {
      return AdvancedExtensibilityFeature.isEnabled(spaceContext.organization.sys.id);
    },
  ],
};

const existingContentTypeIdsResolver = {
  contentTypeIds: [
    'spaceContext',
    async (spaceContext) => {
      const contentTypes = await spaceContext.cma.getContentTypes();
      return contentTypes.items.map((ct) => ct.sys.id);
    },
  ],
};

const newState = editorBase(
  {
    name: 'new',
    url: '_new',
    resolve: {
      contentType: [
        'spaceContext',
        (spaceContext) =>
          spaceContext.space.newContentType({ sys: { type: 'ContentType' }, fields: [] }),
      ],
      publishedContentType: [() => null],
      ...widgetResolvers,
      ...existingContentTypeIdsResolver,
    },
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
          spaceContext.space.getContentType($stateParams.contentTypeId),
      ],
      publishedContentType: [
        'contentType',
        (contentType) =>
          contentType.getPublishedStatus().catch((err) => {
            if (err.statusCode === 404) {
              return null;
            } else {
              throw err;
            }
          }),
      ],
      ...widgetResolvers,
      ...existingContentTypeIdsResolver,
    },
  },
  false
);

export default {
  name: 'content_types',
  url: '/content_types',
  abstract: true,
  children: [list, newState, detail],
};

function editorBase(options, isNew) {
  return {
    redirectTo: '.fields',
    children: [fields, preview, sidebarConfiguration, entryEditorConfiguration],
    controller: [
      '$scope',
      'contentType',
      'customWidgets',
      'editorInterface',
      'publishedContentType',
      'contentTypeIds',
      'hasAdvancedExtensibility',
      (
        $scope,
        contentType,
        customWidgets,
        editorInterface,
        publishedContentType,
        contentTypeIds,
        hasAdvancedExtensibility
      ) => {
        $scope.context.isNew = isNew;
        $scope.contentType = contentType;
        $scope.customWidgets = customWidgets;
        $scope.editorInterface = editorInterface;
        $scope.publishedContentType = publishedContentType;
        $scope.contentTypeIds = contentTypeIds;
        $scope.hasAdvancedExtensibility = hasAdvancedExtensibility;
      },
    ],
    template: '<div cf-content-type-editor class="workbench"></div>',
    ...options,
  };
}
