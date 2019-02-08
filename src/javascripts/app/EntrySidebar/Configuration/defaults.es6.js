import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import { NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces.es6';

export const Publication = {
  widgetId: SidebarWidgetTypes.PUBLICATION,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  title: 'Publish & Status',
  description: 'Built-in - View entry status, publish, etc.'
};

export const ContentPreview = {
  widgetId: SidebarWidgetTypes.CONTENT_PREVIEW,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  title: 'Preview',
  description: 'Built-in - Displays preview functionality.'
};

export const Links = {
  widgetId: SidebarWidgetTypes.INCOMING_LINKS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  title: 'Links',
  description: 'Built-in - Shows where an entry is linked.'
};

export const Translation = {
  widgetId: SidebarWidgetTypes.TRANSLATION,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  title: 'Translation',
  description: 'Built-in - Manage which translations are visible.'
};

export const Versions = {
  widgetId: SidebarWidgetTypes.VERSIONS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  title: 'Versions',
  description:
    'Built-in - View previously published versions. Available only for master environment.'
};

export const Users = {
  widgetId: SidebarWidgetTypes.USERS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  title: 'Users',
  description: 'Built-in - Displays users on the same entry.'
};

export const defaultWidgetsMap = {
  [Publication.widgetId]: Publication,
  [ContentPreview.widgetId]: ContentPreview,
  [Links.widgetId]: Links,
  [Translation.widgetId]: Translation,
  [Versions.widgetId]: Versions,
  [Users.widgetId]: Users
};

export const EntryConfiguration = [
  Publication,
  ContentPreview,
  Links,
  Translation,
  Versions,
  Users
];

export const AssetConfiguration = [Publication, Links, Translation, Users];
