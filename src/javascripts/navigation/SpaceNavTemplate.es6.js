import navBar from 'navigation/templates/NavBar.es6';

const makeRef = (isMaster, ref) => {
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
      sref: makeRef(isMaster, 'settings.locales.list'),
      rootSref: makeRef(isMaster, 'settings.locales'),
      dataViewType: 'spaces-settings-locales',
      title: 'Locales'
    },
    extensions: {
      if: 'nav.canNavigateTo("extensions")',
      sref: makeRef(isMaster, 'settings.extensions.list'),
      rootSref: makeRef(isMaster, 'settings.extensions'),
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions'
    },
    settings: {
      if: 'nav.canNavigateTo("settings")',
      sref: makeRef(isMaster, 'settings.space'),
      dataViewType: 'spaces-settings-space',
      title: 'General settings'
    },
    users: {
      if: 'nav.canNavigateTo("users")',
      sref: makeRef(isMaster, 'settings.users.list'),
      rootSref: makeRef(isMaster, 'settings.users'),
      dataViewType: 'spaces-settings-users',
      title: 'Users'
    },
    teams: {
      if: 'nav.teamsInSpacesFF && nav.hasOrgTeamFeature && nav.canNavigateTo("teams")',
      sref: makeRef(isMaster, 'settings.teams.list'),
      rootSref: makeRef(isMaster, 'settings.teams'),
      dataViewType: 'spaces-settings-teams',
      label: 'new',
      title: 'Teams'
    },
    roles: {
      if: 'nav.canNavigateTo("roles")',
      sref: makeRef(isMaster, 'settings.roles.list'),
      rootSref: makeRef(isMaster, 'settings.roles'),
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions'
    },
    environments: {
      if: 'nav.canNavigateTo("environments")',
      sref: makeRef(isMaster, 'settings.environments'),
      dataViewType: 'spaces-settings-environments',
      title: 'Environments'
    },
    keys: {
      if: 'nav.canNavigateTo("apiKey")',
      sref: makeRef(isMaster, 'api.keys.list'),
      rootSref: makeRef(isMaster, 'api'),
      dataViewType: 'spaces-settings-api',
      title: 'API keys'
    },
    webhooks: {
      if: 'nav.canNavigateTo("webhooks")',
      sref: makeRef(isMaster, 'settings.webhooks.list'),
      rootSref: makeRef(isMaster, 'settings.webhooks'),
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks'
    },
    previews: {
      if: 'nav.canNavigateTo("previews")',
      sref: makeRef(isMaster, 'settings.content_preview.list'),
      rootSref: makeRef(isMaster, 'settings.content_preview'),
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      reload: useSpaceEnv
    },
    usage: {
      if: 'nav.usageEnabled && nav.canNavigateTo("usage")',
      sref: makeRef(isMaster, 'settings.usage'),
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
        sref: makeRef(isMaster, 'content_types.list'),
        rootSref: makeRef(isMaster, 'content_types'),
        dataViewType: 'content-type-list',
        icon: 'nav-ct',
        title: 'Content model'
      },
      {
        if: 'nav.canNavigateTo("entry")',
        sref: makeRef(isMaster, 'entries.list'),
        rootSref: makeRef(isMaster, 'entries'),
        dataViewType: 'entry-list',
        icon: 'nav-entries',
        title: 'Content'
      },
      {
        if: 'nav.canNavigateTo("asset")',
        sref: makeRef(isMaster, 'assets.list'),
        rootSref: makeRef(isMaster, 'assets'),
        dataViewType: 'asset-list',
        icon: 'nav-media',
        title: 'Media'
      },
      {
        if: 'nav.canNavigateTo("apps")',
        dataViewType: 'apps',
        icon: 'nav-apps',
        sref: makeRef(isMaster, 'apps.list'),
        rootSref: makeRef(isMaster, 'apps'),
        title: 'Apps'
      },
      {
        if:
          'nav.canNavigateTo("settings") || nav.canNavigateTo("apiKey") || nav.canNavigateTo("environments")',
        dataViewType: 'space-settings',
        rootSref: makeRef(isMaster, 'settings'),
        icon: 'nav-settings',
        title: useSpaceEnv ? 'Settings' : 'Space settings',
        children: useSpaceEnv ? envSettingsDropdown : spaceSettingsDropdown
      }
    ].filter(item => typeof item === 'object'),
    showQuickNavigation
  );
}
