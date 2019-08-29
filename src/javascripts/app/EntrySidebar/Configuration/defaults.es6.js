import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import { NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces.es6';
import * as FeatureFlagKey from 'featureFlags.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';

export const Publication = {
  widgetId: SidebarWidgetTypes.PUBLICATION,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Publish & Status',
  description: 'Built-in - View entry status, publish, etc.'
};

export const Tasks = {
  widgetId: SidebarWidgetTypes.TASKS,
  widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
  name: 'Tasks',
  description:
    'Built-in - Assign tasks to be completed before publishing. Currently only supported for master environment.',
  availabilityStatus: 'alpha'
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
  Tasks,
  ContentPreview,
  Links,
  Translation,
  Versions,
  Users,
  EntryActivity
];

export const AssetConfiguration = [Publication, Links, Translation, Users];

const availabilityMap = {
  [Publication.widgetId]: true,
  [Tasks.widgetId]: () =>
    getCurrentVariation(FeatureFlagKey.TASKS).then(variation => Boolean(variation)),
  [ContentPreview.widgetId]: true,
  [Links.widgetId]: true,
  [Translation.widgetId]: true,
  [Versions.widgetId]: true,
  [Users.widgetId]: true,
  [EntryActivity.widgetId]: () =>
    getCurrentVariation(FeatureFlagKey.ENTRY_ACTIVITY).then(variation => Boolean(variation))
};

export const getEntryConfiguration = async () => {
  const availability = await Promise.all(
    EntryConfiguration.map(widget => {
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
  }).filter(item => item !== null);
};
