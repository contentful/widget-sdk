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
  teamsInSpacesFF,
  useSpaceEnvironment,
  isMasterEnvironment,
  contentTagsEnabled,
  canManageSpace,
}) {
  const dropdownItems = {
    locales: {
      if: canNavigateTo('locales'),
      sref: makeRef('settings.locales.list', isMasterEnvironment),
      rootSref: makeRef('settings.locales', isMasterEnvironment),
      dataViewType: 'spaces-settings-locales',
      title: 'Locales',
    },
    extensions: {
      if: canNavigateTo('extensions'),
      sref: makeRef('settings.extensions.list', isMasterEnvironment),
      rootSref: makeRef('settings.extensions', isMasterEnvironment),
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions',
    },
    tags: {
      if: contentTagsEnabled && canNavigateTo('tags'),
      sref: makeRef('settings.tags', isMasterEnvironment),
      //rootSref: makeRef('settings.tags', isMasterEnvironment),
      dataViewType: 'spaces-settings-tags',
      title: 'Tags',
      tagLabel: 'new',
    },
    settings: {
      if: canNavigateTo('settings'),
      sref: makeRef('settings.space', isMasterEnvironment),
      dataViewType: 'spaces-settings-space',
      title: 'General settings',
    },
    users: {
      if: canNavigateTo('users'),
      sref: makeRef('settings.users.list', isMasterEnvironment),
      rootSref: makeRef('settings.users', isMasterEnvironment),
      dataViewType: 'spaces-settings-users',
      title: 'Users',
    },
    teams: {
      if: teamsInSpacesFF && hasOrgTeamFeature && canNavigateTo('teams'),
      sref: makeRef('settings.teams.list', isMasterEnvironment),
      rootSref: makeRef('settings.teams', isMasterEnvironment),
      dataViewType: 'spaces-settings-teams',
      label: 'new',
      title: 'Teams',
    },
    roles: {
      if: canNavigateTo('roles'),
      sref: makeRef('settings.roles.list', isMasterEnvironment),
      rootSref: makeRef('settings.roles', isMasterEnvironment),
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions',
    },
    environments: {
      if: canNavigateTo('environments'),
      sref: makeRef('settings.environments', isMasterEnvironment),
      dataViewType: 'spaces-settings-environments',
      title: 'Environments',
    },
    keys: {
      if: canNavigateTo('apiKey'),
      sref: makeRef('api.keys.list', isMasterEnvironment),
      rootSref: makeRef('api', isMasterEnvironment),
      dataViewType: 'spaces-settings-api',
      title: 'API keys',
    },
    webhooks: {
      if: canNavigateTo('webhooks'),
      sref: makeRef('settings.webhooks.list', isMasterEnvironment),
      rootSref: makeRef('settings.webhooks', isMasterEnvironment),
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks',
    },
    previews: {
      if: canNavigateTo('previews'),
      sref: makeRef('settings.content_preview.list', isMasterEnvironment),
      rootSref: makeRef('settings.content_preview', isMasterEnvironment),
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      srefOptions: {
        reload: useSpaceEnvironment,
      },
    },
    usage: {
      if: usageEnabled && canNavigateTo('usage'),
      sref: makeRef('settings.usage', isMasterEnvironment),
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
    !useSpaceEnvironment || isMasterEnvironment
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
      sref: makeRef('content_types.list', isMasterEnvironment),
      rootSref: makeRef('content_types', isMasterEnvironment),
      dataViewType: 'content-type-list',
      navIcon: 'ContentModel',
      title: 'Content model',
    },
    {
      if: canNavigateTo('entry'),
      sref: makeRef('entries.list', isMasterEnvironment),
      rootSref: makeRef('entries', isMasterEnvironment),
      dataViewType: 'entry-list',
      navIcon: 'Content',
      title: 'Content',
    },
    {
      if: canNavigateTo('asset'),
      sref: makeRef('assets.list', isMasterEnvironment),
      rootSref: makeRef('assets', isMasterEnvironment),
      dataViewType: 'asset-list',
      navIcon: 'Media',
      title: 'Media',
    },
    {
      if: canNavigateTo('apps'),
      dataViewType: 'apps',
      navIcon: 'Apps',
      rootSref: makeRef('apps', isMasterEnvironment),
      title: 'Apps',
      render: (item) => renderAppsNavigationItem(item, { isMasterEnvironment, canManageSpace }),
    },
    {
      if: useSpaceEnvironment ? envSettingsDropdown.length > 0 : spaceSettingsDropdown.length > 0,
      dataViewType: 'space-settings',
      rootSref: makeRef('settings', isMasterEnvironment),
      navIcon: 'Settings',
      icon: 'nav-settings',
      title: 'Settings',
      children: useSpaceEnvironment ? envSettingsDropdown : spaceSettingsDropdown,
    },
  ].filter((item) => item.if !== false);
}
