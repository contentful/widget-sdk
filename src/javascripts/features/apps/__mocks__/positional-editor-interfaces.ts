import { getDefaultEditors, getDefaultSidebar } from '../AppEditorInterfaces';
import { WidgetNamespace } from 'features/widget-renderer';

export enum PositionalEditorInterface {
  Editors = 'editors',
  Sidebar = 'sidebar',
}

export const makeGetDefaultByType = {
  [PositionalEditorInterface.Editors]: getDefaultEditors,
  [PositionalEditorInterface.Sidebar]: getDefaultSidebar,
};

export const positionalEditorInterfaceFixtures = {
  [PositionalEditorInterface.Editors]: [
    {
      widgetNameSpace: WidgetNamespace.EDITOR_BUILTIN,
      widgetId: 'default-editor',
    },
    {
      widgetNameSpace: WidgetNamespace.EDITOR_BUILTIN,
      widgetId: 'reference-tree',
    },
  ],
  [PositionalEditorInterface.Sidebar]: [
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
