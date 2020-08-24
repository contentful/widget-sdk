import { getDefaultEditors, getDefaultSidebar } from '../AppEditorInterfaces';
import { WidgetNamespace } from 'features/widget-renderer';

export enum PositionalWidget {
  Editors = 'editors',
  Sidebar = 'sidebar',
}

export const makeGetDefaultByType = {
  [PositionalWidget.Editors]: getDefaultEditors,
  [PositionalWidget.Sidebar]: getDefaultSidebar,
};

export const positionalWidgetFixtures = {
  [PositionalWidget.Editors]: [
    {
      widgetNameSpace: WidgetNamespace.EDITOR_BUILTIN,
      widgetId: 'default-editor',
    },
    {
      widgetNameSpace: WidgetNamespace.EDITOR_BUILTIN,
      widgetId: 'reference-tree',
    },
  ],
  [PositionalWidget.Sidebar]: [
    {
      widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
      widgetId: 'publication-widget',
    },
    {
      widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
      widgetId: 'versions-widget',
    },
  ],
};
