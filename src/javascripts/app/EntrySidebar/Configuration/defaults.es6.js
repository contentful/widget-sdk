import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import { NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces.es6';

export const Publication = {
  widgetId: SidebarWidgetTypes.PUBLICATION,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Publish & Status',
  description: 'Built-in - View entry status, publish, etc.'
};

export const Jobs = {
  widgetId: SidebarWidgetTypes.JOBS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Scheduled Publishing & Status',
  description: 'Built-in - View entry status, schedule publish, etc.'
};

export const Tasks = {
  widgetId: SidebarWidgetTypes.TASKS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Tasks',
  description: 'Built-in - Assign tasks to be completed before publishing.'
};

export const ContentPreview = {
  widgetId: SidebarWidgetTypes.CONTENT_PREVIEW,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Preview',
  description: 'Built-in - Displays preview functionality.'
};

export const Links = {
  widgetId: SidebarWidgetTypes.INCOMING_LINKS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Links',
  description: 'Built-in - Shows where an entry is linked.'
};

export const Translation = {
  widgetId: SidebarWidgetTypes.TRANSLATION,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Translation',
  description: 'Built-in - Manage which translations are visible.'
};

export const Versions = {
  widgetId: SidebarWidgetTypes.VERSIONS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Versions',
  description:
    'Built-in - View previously published versions. Available only for master environment.'
};

export const Users = {
  widgetId: SidebarWidgetTypes.USERS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Users',
  description: 'Built-in - Displays users on the same entry.'
};

export const EntryActivity = {
  widgetId: 'entry-activity-widget',
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Entry activity',
  description: 'Built-in - See the list of all changes to an entry'
};

export const defaultWidgetsMap = {
  [Publication.widgetId]: Publication,
  [Jobs.widgetId]: Jobs,
  [Tasks.widgetId]: Tasks,
  [ContentPreview.widgetId]: ContentPreview,
  [Links.widgetId]: Links,
  [Translation.widgetId]: Translation,
  [Versions.widgetId]: Versions,
  [Users.widgetId]: Users,
  [EntryActivity.widgetId]: EntryActivity
};

export const EntryConfiguration = [
  Publication,
  Jobs,
  Tasks,
  ContentPreview,
  Links,
  Translation,
  Versions,
  Users,
  EntryActivity
];

export const AssetConfiguration = [Publication, Links, Translation, Users];
