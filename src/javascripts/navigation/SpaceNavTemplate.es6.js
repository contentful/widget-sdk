import navBar from 'navigation/templates/NavBar.es6';

const makeRef = (ref, isMaster) => {
  if (isMaster) {
    return `spaces.detail.${ref}`;
  } else {
    return `spaces.detail.environment.${ref}`;
  }
};

export default function spaceNavTemplate(useSpaceEnv, isMaster) {
  const dropdownItems = {
    locales: {
      if: 'nav.canNavigateTo("locales")',
      sref: makeRef('settings.locales.list', isMaster),
      rootSref: makeRef('settings.locales', isMaster),
      dataViewType: 'spaces-settings-locales',
      title: 'Locales'
    },
    extensions: {
      if: 'nav.canNavigateTo("extensions")',
      sref: makeRef('settings.extensions.list', isMaster),
      rootSref: makeRef('settings.extensions', isMaster),
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions'
    },
    settings: {
      if: 'nav.canNavigateTo("settings")',
      sref: makeRef('settings.space', isMaster),
      dataViewType: 'spaces-settings-space',
      title: 'General settings'
    },
    users: {
      if: 'nav.canNavigateTo("users")',
      sref: makeRef('settings.users.list', isMaster),
      rootSref: makeRef('settings.users', isMaster),
      dataViewType: 'spaces-settings-users',
      title: 'Users'
    },
    teams: {
      if: 'nav.teamsInSpacesFF && nav.hasOrgTeamFeature && nav.canNavigateTo("teams")',
      sref: makeRef('settings.teams.list', isMaster),
      rootSref: makeRef('settings.teams', isMaster),
      dataViewType: 'spaces-settings-teams',
      label: 'new',
      title: 'Teams'
    },
    roles: {
      if: 'nav.canNavigateTo("roles")',
      sref: makeRef('settings.roles.list', isMaster),
      rootSref: makeRef('settings.roles', isMaster),
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions'
    },
    environments: {
      if: 'nav.canNavigateTo("environments")',
      sref: makeRef('settings.environments', isMaster),
      dataViewType: 'spaces-settings-environments',
      title: 'Environments'
    },
    keys: {
      if: 'nav.canNavigateTo("apiKey")',
      sref: makeRef('api.keys.list', isMaster),
      rootSref: makeRef('api', isMaster),
      dataViewType: 'spaces-settings-api',
      title: 'API keys'
    },
    webhooks: {
      if: 'nav.canNavigateTo("webhooks")',
      sref: makeRef('settings.webhooks.list', isMaster),
      rootSref: makeRef('settings.webhooks', isMaster),
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks'
    },
    previews: {
      if: 'nav.canNavigateTo("previews")',
      sref: makeRef('settings.content_preview.list', isMaster),
      rootSref: makeRef('settings.content_preview', isMaster),
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      reload: useSpaceEnv
    },
    usage: {
      if: 'nav.usageEnabled && nav.canNavigateTo("usage")',
      sref: makeRef('settings.usage', isMaster),
      dataViewType: 'spaces-settings-usage',
      title: 'Usage',
      reload: useSpaceEnv
    }
  };

  const envSettingsDropdown = [
    {
      // If the user cannot access locales but has manager role, do not show the
      // environment settings section.
      if: 'nav.canNavigateTo("locales")',
      separator: true,
      label: 'Environment settings',
      tooltip: 'These settings apply only to the environment you’ve currently selected.'
    },
    dropdownItems.locales,
    dropdownItems.extensions,
    {
      separator: true,
      label: 'Space settings',
      tooltip: 'These settings apply to the space and all its environments.'
    },
    dropdownItems.settings,
    dropdownItems.users,
    dropdownItems.teams,
    dropdownItems.roles,
    dropdownItems.environments,
    dropdownItems.keys,
    dropdownItems.webhooks,
    dropdownItems.previews,
    dropdownItems.usage
  ];

  const spaceSettingsDropdown = [
    dropdownItems.settings,
    dropdownItems.locales,
    dropdownItems.users,
    dropdownItems.teams,
    dropdownItems.roles,
    dropdownItems.keys,
    dropdownItems.webhooks,
    dropdownItems.extensions,
    dropdownItems.previews,
    dropdownItems.usage
  ];

  const showQuickNavigation = true;

  return navBar(
    [
      !useSpaceEnv || isMaster
        ? {
            if: 'nav.canNavigateTo("spaceHome")',
            sref: 'spaces.detail.home',
            dataViewType: 'space-home',
            icon: 'nav-home',
            title: 'Space home'
          }
        : {
            disabled: true,
            tooltip: 'The space home is only available in the master environment.',
            if: 'nav.canNavigateTo("spaceHome")',
            icon: 'nav-home',
            title: 'Space home'
          },
      {
        if: 'nav.canNavigateTo("contentType")',
        sref: makeRef('content_types.list', isMaster),
        rootSref: makeRef('content_types', isMaster),
        dataViewType: 'content-type-list',
        icon: 'nav-ct',
        title: 'Content model'
      },
      {
        if: 'nav.canNavigateTo("entry")',
        sref: makeRef('entries.list', isMaster),
        rootSref: makeRef('entries', isMaster),
        dataViewType: 'entry-list',
        icon: 'nav-entries',
        title: 'Content'
      },
      {
        if: 'nav.canNavigateTo("asset")',
        sref: makeRef('assets.list', isMaster),
        rootSref: makeRef('assets', isMaster),
        dataViewType: 'asset-list',
        icon: 'nav-media',
        title: 'Media'
      },
      {
        if: 'nav.canNavigateTo("apps")',
        dataViewType: 'apps',
        icon: 'nav-apps',
        sref: makeRef('apps.list', isMaster),
        rootSref: makeRef('apps', isMaster),
        title: 'Apps'
      },
      {
        if:
          'nav.canNavigateTo("settings") || nav.canNavigateTo("apiKey") || nav.canNavigateTo("environments")',
        dataViewType: 'space-settings',
        rootSref: makeRef('settings', isMaster),
        icon: 'nav-settings',
        title: useSpaceEnv ? 'Settings' : 'Space settings',
        children: useSpaceEnv ? envSettingsDropdown : spaceSettingsDropdown
      }
    ].filter(item => typeof item === 'object'),
    showQuickNavigation
  );
}
