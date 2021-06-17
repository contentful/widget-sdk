import SidebarWidgetTypes from '../SidebarWidgetTypes';
import { getSpaceFeature, SpaceFeatures } from 'data/CMA/ProductCatalog';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { fetchContentfulAppsConfig } from 'features/contentful-apps';
import { FLAGS, getVariation } from 'core/feature-flags';
import { getSpaceEntitlementSet } from 'app/SpaceSettings/Usage/services/EntitlementService';

export const Publication = {
  widgetId: SidebarWidgetTypes.PUBLICATION,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
  name: 'Publish & Status',
  description: 'Built-in - View entry status, publish, etc.',
};

export const Releases = {
  widgetId: SidebarWidgetTypes.RELEASES,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
  name: 'Release',
  description: 'Built-in - View release, add to it, etc.',
};

export const Tasks = {
  widgetId: SidebarWidgetTypes.TASKS,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
  name: 'Tasks',
  description:
    'Built-in - Assign tasks to be completed before publishing. Currently only supported for master environment.',
};

export const ContentPreview = {
  widgetId: SidebarWidgetTypes.CONTENT_PREVIEW,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
  name: 'Preview',
  description: 'Built-in - Displays preview functionality.',
};

export const Links = {
  widgetId: SidebarWidgetTypes.INCOMING_LINKS,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
  name: 'Links',
  description: 'Built-in - Shows where an entry is linked.',
};

export const Translation = {
  widgetId: SidebarWidgetTypes.TRANSLATION,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
  name: 'Translation',
  description: 'Built-in - Manage which translations are visible.',
};

export const Versions = {
  widgetId: SidebarWidgetTypes.VERSIONS,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
  name: 'Versions',
  description:
    'Built-in - View previously published versions. Available only for master environment.',
};

export const Users = {
  widgetId: SidebarWidgetTypes.USERS,
  widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
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
};

export const EntryConfiguration = [
  Publication,
  Releases,
  Tasks,
  ContentPreview,
  Links,
  Translation,
  Versions,
];

export const AssetConfiguration = [Publication, Releases, Links, Translation];

const getAvailabilityMap = (spaceId, environmentId, organizationId) => ({
  [Publication.widgetId]: true,
  [Releases.widgetId]: async () =>
    fetchContentfulAppsConfig({ spaceId, environmentId, organizationId, appId: 'launch' }).then(
      (app) => app.isPurchased && app.isInstalled
    ),
  [Tasks.widgetId]: () => getSpaceFeature(spaceId, SpaceFeatures.CONTENT_WORKFLOW_TASKS, false),
  [ContentPreview.widgetId]: true,
  [Links.widgetId]: true,
  [Translation.widgetId]: true,
  [Versions.widgetId]: true,
});

export const getEntryConfiguration = async ({ spaceId, environmentId, organizationId }) => {
  // Note: this is a call to test the new entitlements service under production load
  // it will be removed shortly and we do not care about the response
  // in the future this service will be used to check space features and quotas
  getVariation(FLAGS.ENTITLEMENTS_API).then((enabled) => {
    if (enabled) {
      getSpaceEntitlementSet(spaceId).catch(() => {});
    }
  });

  const availabilityMap = getAvailabilityMap(spaceId, environmentId, organizationId);
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
