import * as EditorInterfaceTransformer from 'widgets/EditorInterfaceTransformer';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { ContentTypesPage } from 'components/tabs/content_type_list/ContentTypesPage';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { getSpaceContext } from 'classes/spaceContext';

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
    // DI used as a workaround for child routes to wait for the spacecontext
    // to be initialized (defined in "src/javascripts/states/Spaces.js")
    'initializeSpaceContext',
    async () => {
      const loader = await getCustomWidgetLoader();
      const widgets = await loader.getUncachedForListing();

      return widgets.map(toLegacyWidget);
    },
  ],
  editorInterface: [
    'contentType',
    async (contentType) => {
      const ct = contentType.data;
      const ei = await getSpaceContext().cma.getEditorInterface(ct.sys.id);
      return EditorInterfaceTransformer.fromAPI(ct, ei);
    },
  ],
  hasAdvancedExtensibility: [
    'initializeSpaceContext',
    () => {
      return AdvancedExtensibilityFeature.isEnabled(getSpaceContext().organization.sys.id);
    },
  ],
};

const existingContentTypeIdsResolver = {
  contentTypeIds: [
    'initializeSpaceContext',
    async () => {
      const contentTypes = await getSpaceContext().cma.getContentTypes();
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
        'initializeSpaceContext',
        () => getSpaceContext().space.newContentType({ sys: { type: 'ContentType' }, fields: [] }),
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
        'initializeSpaceContext',
        ($stateParams) => getSpaceContext().space.getContentType($stateParams.contentTypeId),
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
