import navBar from 'navigation/templates/NavBar.es6';

export default function spaceNavTemplate(useSpaceEnv, isMaster) {
  const makeRef = spaceRef => {
    if (useSpaceEnv && !isMaster) {
      return `spaces.detail.environment.${spaceRef}`;
    } else {
      return `spaces.detail.${spaceRef}`;
    }
  };

  const dropdownItems = {
    locales: {
      if: 'nav.canNavigateTo("locales")',
      sref: makeRef('settings.locales.list'),
      rootSref: makeRef('settings.locales'),
      dataViewType: 'spaces-settings-locales',
      title: 'Locales'
    },
    extensions: {
      if: 'nav.canNavigateTo("extensions")',
      sref: makeRef('settings.extensions.list'),
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions'
    },
    settings: {
      if: 'nav.canNavigateTo("settings")',
      sref: makeRef('settings.space'),
      dataViewType: 'spaces-settings-space',
      title: 'General settings'
    },
    users: {
      if: 'nav.canNavigateTo("users")',
      sref: makeRef('settings.users.list'),
      rootSref: makeRef('settings.users'),
      dataViewType: 'spaces-settings-users',
      title: 'Users'
    },
    roles: {
      if: 'nav.canNavigateTo("roles")',
      sref: makeRef('settings.roles.list'),
      rootSref: makeRef('settings.roles'),
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions'
    },
    environments: {
      if: 'nav.canNavigateTo("environments")',
      sref: makeRef('settings.environments'),
      dataViewType: 'spaces-settings-environments',
      title: 'Environments'
    },
    keys: {
      if: 'nav.canNavigateTo("apiKey")',
      sref: makeRef('api.keys.list'),
      rootSref: makeRef('api'),
      dataViewType: 'spaces-settings-api',
      title: 'API keys'
    },
    webhooks: {
      if: 'nav.canNavigateTo("webhooks")',
      sref: makeRef('settings.webhooks.list'),
      rootSref: makeRef('settings.webhooks'),
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks'
    },
    previews: {
      if: 'nav.canNavigateTo("previews")',
      sref: makeRef('settings.content_preview.list'),
      rootSref: makeRef('settings.content_preview'),
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      reload: useSpaceEnv
    },
    usage: {
      if: 'nav.usageEnabled && nav.canNavigateTo("usage")',
      sref: makeRef('settings.usage'),
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
    dropdownItems.roles,
    dropdownItems.keys,
    dropdownItems.webhooks,
    dropdownItems.extensions,
    dropdownItems.previews,
    dropdownItems.usage
  ];

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
        sref: makeRef('content_types.list'),
        rootSref: makeRef('content_types'),
        dataViewType: 'content-type-list',
        icon: 'nav-ct',
        title: 'Content model'
      },
      {
        if: 'nav.canNavigateTo("entry")',
        sref: makeRef('entries.list'),
        rootSref: makeRef('entries'),
        dataViewType: 'entry-list',
        icon: 'nav-entries',
        title: 'Content'
      },
      {
        if: 'nav.canNavigateTo("asset")',
        sref: makeRef('assets.list'),
        rootSref: makeRef('assets'),
        dataViewType: 'asset-list',
        icon: 'nav-media',
        title: 'Media'
      },
      (!useSpaceEnv || isMaster) && {
        if: 'nav.appsEnabled && nav.canNavigateTo("apps")',
        dataViewType: 'apps',
        icon: 'nav-apps',
        label: 'alpha',
        sref: makeRef('apps.list'),
        rootSref: makeRef('apps'),
        title: 'Apps'
      },
      {
        if:
          'nav.canNavigateTo("settings") || nav.canNavigateTo("apiKey") || nav.canNavigateTo("environments")',
        dataViewType: 'space-settings',
        rootSref: makeRef('settings'),
        icon: 'nav-settings',
        title: useSpaceEnv ? 'Settings' : 'Space settings',
        children: useSpaceEnv ? envSettingsDropdown : spaceSettingsDropdown
      }
    ].filter(item => typeof item === 'object')
  );
}
