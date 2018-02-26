import navBar from 'navigation/templates/NavBar';

export default function spaceNavTemplate (useSpaceEnv) {
  const makeRef = (spaceRef) => {
    if (useSpaceEnv) {
      return `spaces.detail.environment.${spaceRef}`;
    } else {
      return `spaces.detail.${spaceRef}`;
    }
  };

  const dropdownItems = {
    locales: {
      if: 'nav.canNavigateTo("settings")',
      sref: makeRef('settings.locales.list'),
      rootSref: makeRef('settings.locales'),
      dataViewType: 'spaces-settings-locales',
      title: 'Locales'
    },
    extensions: {
      if: 'nav.canNavigateTo("settings")',
      sref: makeRef('settings.extensions'),
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions'
    },
    settings: {
      if: 'nav.canNavigateTo("settings")',
      sref: 'spaces.detail.settings.space',
      dataViewType: 'spaces-settings-space',
      title: 'General settings',
      reload: useSpaceEnv
    },
    users: {
      if: 'nav.canNavigateTo("settings")',
      sref: 'spaces.detail.settings.users.list',
      rootSref: 'spaces.detail.settings.users',
      dataViewType: 'spaces-settings-users',
      title: 'Users',
      reload: useSpaceEnv
    },
    roles: {
      if: 'nav.canNavigateTo("settings")',
      sref: 'spaces.detail.settings.roles.list',
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions',
      rootSref: 'spaces.detail.settings.roles',
      reload: useSpaceEnv
    },
    environments: {
      if: 'nav.canNavigateTo("settings")',
      sref: 'spaces.detail.settings.environments',
      dataViewType: 'spaces-settings-environments',
      title: 'Environments',
      reload: useSpaceEnv
    },
    keys: {
      if: 'nav.canNavigateTo("apiKey")',
      sref: 'spaces.detail.api.keys.list',
      rootSref: 'spaces.detail.api',
      dataViewType: 'spaces-settings-api',
      title: 'API keys',
      reload: useSpaceEnv
    },
    webhooks: {
      if: 'nav.canNavigateTo("settings")',
      sref: 'spaces.detail.settings.webhooks.list',
      rootSref: 'spaces.detail.settings.webhooks',
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks',
      reload: useSpaceEnv
    },
    previews: {
      if: 'nav.canNavigateTo("settings")',
      sref: 'spaces.detail.settings.content_preview.list',
      rootSref: 'spaces.detail.settings.content_preview',
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      reload: useSpaceEnv
    },
    usage: {
      if: 'nav.usageEnabled && nav.canNavigateTo("settings")',
      sref: 'spaces.detail.settings.usage',
      dataViewType: 'spaces-settings-usage',
      title: 'Usage',
      reload: useSpaceEnv
    }
  };

  const envSettingsDropdown = [
    {
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

  return navBar([
    {
      if: 'nav.canNavigateTo("spaceHome")',
      sref: 'spaces.detail.home',
      dataViewType: 'space-home',
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
    {
      if: 'nav.canNavigateTo("settings") || nav.canNavigateTo("apiKey")',
      dataViewType: 'space-settings',
      rootSref: makeRef('settings'),
      icon: 'nav-settings',
      title: useSpaceEnv ? 'Settings' : 'Space settings',
      children: useSpaceEnv ? envSettingsDropdown : spaceSettingsDropdown
    }
  ]);
}
