import { renderAppsNavigationItem } from 'features/apps';
import { routes } from 'core/react-routing';

const makeRef = (ref, isMaster) =>
  isMaster ? `spaces.detail.${ref}` : `spaces.detail.environment.${ref}`;

type Props = {
  canNavigateTo: (section: string) => boolean;
  usageEnabled: boolean;
  hasOrgTeamFeature: boolean;
  useSpaceEnvironment: boolean;
  isUnscopedRoute: boolean;
  contentTagsEnabled: boolean;
  canManageSpace: boolean;
};

export function getSpaceNavigationItems({
  canNavigateTo,
  usageEnabled,
  hasOrgTeamFeature,
  useSpaceEnvironment,
  isUnscopedRoute,
  contentTagsEnabled,
  canManageSpace,
}: Props) {
  const locales = routes['locales.list']({ withEnvironment: !isUnscopedRoute });
  const users = routes['users.list']({ withEnvironment: !isUnscopedRoute });
  const webhooks = routes['webhooks.list']({ withEnvironment: !isUnscopedRoute });
  const roles = routes['roles.list']({ withEnvironment: !isUnscopedRoute });
  const tags = routes['tags']({ withEnvironment: !isUnscopedRoute });

  const dropdownItems = {
    locales: {
      if: canNavigateTo('locales'),
      sref: locales.path,
      srefParams: locales.params,
      rootSref: locales.path,
      dataViewType: 'spaces-settings-locales',
      title: 'Locales',
    },
    extensions: {
      if: canNavigateTo('extensions'),
      sref: makeRef('settings.extensions.list', isUnscopedRoute),
      rootSref: makeRef('settings.extensions', isUnscopedRoute),
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions',
    },
    tags: {
      if: contentTagsEnabled && canNavigateTo('tags'),
      sref: tags.path,
      rootSref: tags.path,
      dataViewType: 'spaces-settings-tags',
      title: 'Tags',
      tagLabel: 'new',
    },
    settings: {
      if: canNavigateTo('settings'),
      sref: makeRef('settings.space', isUnscopedRoute),
      dataViewType: 'spaces-settings-space',
      title: 'General settings',
    },
    users: {
      if: canNavigateTo('users'),
      sref: users.path,
      srefParams: users.params,
      rootSref: users.path,
      dataViewType: 'spaces-settings-users',
      title: 'Users',
    },
    teams: {
      if: hasOrgTeamFeature && canNavigateTo('teams'),
      sref: makeRef('settings.teams.list', isUnscopedRoute),
      rootSref: makeRef('settings.teams', isUnscopedRoute),
      dataViewType: 'spaces-settings-teams',
      label: 'new',
      title: 'Teams',
    },
    embargoedAssets: {
      if: canNavigateTo('embargoedAssets'),
      sref: makeRef('settings.embargoedAssets', isUnscopedRoute),
      dataViewType: 'spaces-settings-embargoedAssets',
      title: 'Embargoed Assets',
    },
    roles: {
      if: canNavigateTo('roles'),
      sref: roles.path,
      srefParams: roles.params,
      rootSref: roles.path,
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions',
    },
    environments: {
      if: canNavigateTo('environments'),
      sref: makeRef('settings.environments', isUnscopedRoute),
      dataViewType: 'spaces-settings-environments',
      title: 'Environments',
    },
    keys: {
      if: canNavigateTo('apiKey'),
      sref: makeRef('api.keys.list', isUnscopedRoute),
      rootSref: makeRef('api', isUnscopedRoute),
      dataViewType: 'spaces-settings-api',
      title: 'API keys',
    },
    webhooks: {
      if: canNavigateTo('webhooks'),
      sref: webhooks.path,
      srefParams: webhooks.params,
      rootSref: webhooks.path,
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks',
    },
    previews: {
      if: canNavigateTo('previews'),
      sref: makeRef('settings.content_preview.list', isUnscopedRoute),
      rootSref: makeRef('settings.content_preview', isUnscopedRoute),
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      srefOptions: {
        reload: useSpaceEnvironment,
      },
    },
    usage: {
      if: usageEnabled && canNavigateTo('usage'),
      sref: makeRef('settings.usage', isUnscopedRoute),
      dataViewType: 'spaces-settings-usage',
      title: 'Usage',
      srefOptions: {
        reload: useSpaceEnvironment,
      },
    },
  };

  const envSettingsDropdown = [
    {
      // If the user cannot access locales but has manager role, do not show the
      // environment settings section.
      if: canNavigateTo('locales'),
      separator: true,
      label: 'Environment settings',
      tooltip: 'These settings apply only to the environment you’ve currently selected.',
    },
    dropdownItems.locales,
    dropdownItems.extensions,
    dropdownItems.tags,
    {
      separator: true,
      label: 'Space settings',
      tooltip: 'These settings apply to the space and all its environments.',
    },
    dropdownItems.settings,
    dropdownItems.users,
    dropdownItems.teams,
    dropdownItems.roles,
    dropdownItems.environments,
    dropdownItems.keys,
    dropdownItems.embargoedAssets,
    dropdownItems.webhooks,
    dropdownItems.previews,
    dropdownItems.usage,
  ].filter((item) => item.if !== false);

  const spaceSettingsDropdown = [
    dropdownItems.tags,
    dropdownItems.settings,
    dropdownItems.locales,
    dropdownItems.users,
    dropdownItems.teams,
    dropdownItems.roles,
    dropdownItems.keys,
    dropdownItems.webhooks,
    dropdownItems.extensions,
    dropdownItems.previews,
    dropdownItems.usage,
  ].filter((item) => item.if !== false);

  return [
    !useSpaceEnvironment || isUnscopedRoute
      ? {
          if: canNavigateTo('spaceHome'),
          sref: 'spaces.detail.home',
          dataViewType: 'space-home',
          navIcon: 'Home',
          title: 'Space home',
        }
      : {
          if: canNavigateTo('spaceHome'),
          disabled: true,
          tooltip: 'The space home is only available in the master environment.',
          navIcon: 'Home',
          title: 'Space home',
        },
    {
      if: canNavigateTo('contentType'),
      sref: makeRef('content_types.list', isUnscopedRoute),
      rootSref: makeRef('content_types', isUnscopedRoute),
      dataViewType: 'content-type-list',
      navIcon: 'ContentModel',
      title: 'Content model',
    },
    {
      if: canNavigateTo('entry'),
      sref: makeRef('entries.list', isUnscopedRoute),
      rootSref: makeRef('entries', isUnscopedRoute),
      dataViewType: 'entry-list',
      navIcon: 'Content',
      title: 'Content',
    },
    {
      if: canNavigateTo('asset'),
      sref: makeRef('assets.list', isUnscopedRoute),
      rootSref: makeRef('assets', isUnscopedRoute),
      dataViewType: 'asset-list',
      navIcon: 'Media',
      title: 'Media',
    },
    {
      if: canNavigateTo('apps'),
      dataViewType: 'apps',
      navIcon: 'Apps',
      rootSref: makeRef('apps', isUnscopedRoute),
      title: 'Apps',
      render: (item) => renderAppsNavigationItem(item, { isUnscopedRoute, canManageSpace }),
    },
    {
      if: useSpaceEnvironment ? envSettingsDropdown.length > 0 : spaceSettingsDropdown.length > 0,
      dataViewType: 'space-settings',
      rootSref: makeRef('settings', isUnscopedRoute),
      navIcon: 'Settings',
      icon: 'nav-settings',
      title: 'Settings',
      children: useSpaceEnvironment ? envSettingsDropdown : spaceSettingsDropdown,
    },
  ].filter((item) => item.if !== false);
}
