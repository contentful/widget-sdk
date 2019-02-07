import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import { WidgetNamespace } from './constants.es6';

const Publication = {
  widgetId: SidebarWidgetTypes.PUBLICATION,
  widgetNamespace: WidgetNamespace.builtin,
  title: 'Publish & Status',
  description: 'Built-in - View entry status, publish, etc.'
};

const ContentPreview = {
  widgetId: SidebarWidgetTypes.CONTENT_PREVIEW,
  widgetNamespace: WidgetNamespace.builtin,
  title: 'Preview',
  description: 'Built-in - Displays preview functionality.'
};

const Links = {
  widgetId: SidebarWidgetTypes.INCOMING_LINKS,
  widgetNamespace: WidgetNamespace.builtin,
  title: 'Links',
  description: 'Built-in - Shows where an entry is linked.'
};

const Translation = {
  widgetId: SidebarWidgetTypes.TRANSLATION,
  widgetNamespace: WidgetNamespace.builtin,
  title: 'Translation',
  description: 'Built-in - Manage which translations are visible.'
};

const Versions = {
  widgetId: SidebarWidgetTypes.VERSIONS,
  widgetNamespace: WidgetNamespace.builtin,
  title: 'Versions',
  description: 'Built-in - View previously published versions.'
};

const Users = {
  widgetId: SidebarWidgetTypes.USERS,
  widgetNamespace: WidgetNamespace.builtin,
  title: 'Users',
  description: 'Built-in - Displays users on the same entry.'
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
