import { NAMESPACE_EXTENSION, NAMESPACE_BUILTIN } from 'widgets/WidgetNamespaces.es6';
import { pick } from 'lodash/fp';

export const createContentTypeConfig = (contentTypeName, id) => ({
  sys: {
    id
  },
  name: contentTypeName,
  fields: [
    {
      id: 'title',
      name: 'Title',
      required: true,
      localized: false,
      type: 'Symbol'
    },
    {
      id: 'image',
      name: 'Image',
      type: 'Link',
      localized: false,
      required: false,
      linkType: 'Asset'
    },
    {
      id: 'tags',
      name: 'Tags',
      type: 'Array',
      localized: false,
      required: false,
      items: {
        type: 'Symbol'
      }
    }
  ]
});

export const createEditorControlsConfig = uploaderExtensionId => [
  {
    fieldId: 'title',
    widgetId: 'singleLine',
    widgetNamespace: NAMESPACE_BUILTIN
  },
  {
    fieldId: 'image',
    widgetId: uploaderExtensionId,
    widgetNamespace: NAMESPACE_EXTENSION
  },
  {
    fieldId: 'tags',
    widgetId: 'tagEditor',
    widgetNamespace: NAMESPACE_BUILTIN
  }
];

export const createEditorSidebarConfig = (taggingExtensionId, defaultWidgets) => {
  const defaultSidebar = defaultWidgets.map(pick(['widgetId', 'widgetNamespace']));

  return [
    defaultSidebar[0],
    {
      widgetId: taggingExtensionId,
      widgetNamespace: NAMESPACE_EXTENSION,
      settings: {
        imageFieldId: 'image',
        tagFieldId: 'tags'
      }
    },
    ...defaultSidebar.slice(1)
  ];
};
