import SidebarWidgetTypes from '../SidebarWidgetTypes';
import { NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces';
import * as FeatureFlagKey from 'featureFlags';
import { getCurrentSpaceFeature } from 'data/CMA/ProductCatalog';

export const Publication = {
  widgetId: SidebarWidgetTypes.PUBLICATION,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Publish & Status',
  description: 'Built-in - View entry status, publish, etc.',
};

export const Releases = {
  widgetId: SidebarWidgetTypes.RELEASES,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Release',
  description: 'Built-in - View release, add to it, etc.',
};

export const Tasks = {
  widgetId: SidebarWidgetTypes.TASKS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Tasks',
  description:
    'Built-in - Assign tasks to be completed before publishing. Currently only supported for master environment.',
};

export const ContentPreview = {
  widgetId: SidebarWidgetTypes.CONTENT_PREVIEW,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Preview',
  description: 'Built-in - Displays preview functionality.',
};

export const Links = {
  widgetId: SidebarWidgetTypes.INCOMING_LINKS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Links',
  description: 'Built-in - Shows where an entry is linked.',
};

export const Translation = {
  widgetId: SidebarWidgetTypes.TRANSLATION,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Translation',
  description: 'Built-in - Manage which translations are visible.',
};

export const Versions = {
  widgetId: SidebarWidgetTypes.VERSIONS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Versions',
  description:
    'Built-in - View previously published versions. Available only for master environment.',
};

export const Users = {
  widgetId: SidebarWidgetTypes.USERS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Users',
  description: 'Built-in - Displays users on the same entry.',
};

export const defaultWidgetsMap = {
  [Publication.widgetId]: Publication,
  [Releases.widgetId]: Releases,
  [Tasks.widgetId]: Tasks,
  [ContentPreview.widgetId]: ContentPreview,
  [Links.widgetId]: Links,
  [Translation.widgetId]: Translation,
  [Versions.widgetId]: Versions,
  [Users.widgetId]: Users,
};

export const EntryConfiguration = [
  Publication,
  Releases,
  Tasks,
  ContentPreview,
  Links,
  Translation,
  Versions,
  Users,
];

export const AssetConfiguration = [Publication, Releases, Links, Translation, Users];

const availabilityMap = {
  [Publication.widgetId]: true,
  [Releases.widgetId]: true,
  [Tasks.widgetId]: () => getCurrentSpaceFeature(FeatureFlagKey.CONTENT_WORKFLOW_TASKS, false),
  [ContentPreview.widgetId]: true,
  [Links.widgetId]: true,
  [Translation.widgetId]: true,
  [Versions.widgetId]: true,
  [Users.widgetId]: true,
};

export const getEntryConfiguration = async () => {
  const availability = await Promise.all(
    EntryConfiguration.map((widget) => {
      const value = availabilityMap[widget.widgetId];
      if (typeof value === 'function') {
        return value();
      }
      return value;
    })
  );

  return EntryConfiguration.filter((item, index) => {
    if (availability[index]) {
      return item;
    }
    return null;
  }).filter((item) => item !== null);
};
