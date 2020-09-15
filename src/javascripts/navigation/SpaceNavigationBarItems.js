import { renderAppsNavigationItem } from 'features/apps';

const makeRef = (ref, isMaster) => {
  if (isMaster) {
    return `spaces.detail.${ref}`;
  } else {
    return `spaces.detail.environment.${ref}`;
  }
};

export function getSpaceNavigationItems({
  canNavigateTo,
  usageEnabled,
  hasOrgTeamFeature,
  useSpaceEnvironment,
  isUnscopedRoute,
  contentTagsEnabled,
  canManageSpace,
  isSpaceTrial,
}) {
  const dropdownItems = {
    locales: {
      if: canNavigateTo('locales'),
      sref: makeRef('settings.locales.list', isUnscopedRoute),
      rootSref: makeRef('settings.locales', isUnscopedRoute),
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
      sref: makeRef('settings.tags', isUnscopedRoute),
      //rootSref: makeRef('settings.tags', isUnscopedRoute),
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
      sref: makeRef('settings.users.list', isUnscopedRoute),
      rootSref: makeRef('settings.users', isUnscopedRoute),
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
    roles: {
      if: canNavigateTo('roles'),
      sref: makeRef('settings.roles.list', isUnscopedRoute),
      rootSref: makeRef('settings.roles', isUnscopedRoute),
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
      sref: makeRef('settings.webhooks.list', isUnscopedRoute),
      rootSref: makeRef('settings.webhooks', isUnscopedRoute),
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
          if: canNavigateTo('spaceHome') || isSpaceTrial,
          sref: 'spaces.detail.home',
          dataViewType: 'space-home',
          navIcon: 'Home',
          title: 'Space home',
        }
      : {
          if: canNavigateTo('spaceHome') || isSpaceTrial,
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
