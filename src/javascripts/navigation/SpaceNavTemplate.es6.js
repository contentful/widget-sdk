import navBar from 'navigation/templates/NavBar';

export default function spaceNavTemplate (useSpaceEnv) {
  const makeRef = (spaceRef) => {
    if (useSpaceEnv) {
      return `spaces.detail.environment.${spaceRef}`;
    } else {
      return `spaces.detail.${spaceRef}`;
    }
  };

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
      title: 'Space settings',
      children: [
        {
          separator: true,
          label: 'Environment settings'
        },
        {
          if: 'nav.canNavigateTo("settings")',
          sref: makeRef('settings.locales.list'),
          rootSref: makeRef('settings.locales'),
          dataViewType: 'spaces-settings-locales',
          title: 'Locales'
        },
        {
          if: 'nav.canNavigateTo("settings")',
          sref: makeRef('settings.extensions'),
          dataViewType: 'spaces-settings-extensions',
          title: 'Extensions'
        },
        {
          separator: true,
          label: 'Space settings'
        },
        {
          if: 'nav.canNavigateTo("settings")',
          sref: 'spaces.detail.settings.space',
          dataViewType: 'spaces-settings-space',
          title: 'General settings',
          reload: useSpaceEnv
        },
        {
          if: 'nav.canNavigateTo("settings")',
          sref: 'spaces.detail.settings.users.list',
          rootSref: 'spaces.detail.settings.users',
          dataViewType: 'spaces-settings-users',
          title: 'Users',
          reload: useSpaceEnv
        },
        {
          if: 'nav.canNavigateTo("settings")',
          sref: 'spaces.detail.settings.roles.list',
          dataViewType: 'spaces-settings-roles',
          title: 'Roles & permissions',
          rootSref: 'spaces.detail.settings.roles',
          reload: useSpaceEnv
        },
        {
          if: 'nav.environmentsEnabled && nav.canNavigateTo("settings")',
          sref: 'spaces.detail.settings.environments',
          dataViewType: 'spaces-settings-environments',
          title: 'Environments',
          reload: useSpaceEnv
        },
        {
          if: 'nav.canNavigateTo("apiKey")',
          sref: 'spaces.detail.api.home',
          rootSref: 'spaces.detail.api',
          dataViewType: 'api-home',
          title: 'API keys',
          reload: useSpaceEnv
        },
        {
          if: 'nav.canNavigateTo("settings")',
          sref: '.settings.webhooks.list',
          rootSref: 'spaces.detail.settings.webhooks',
          dataViewType: 'spaces-settings-webhooks',
          title: 'Webhooks',
          reload: useSpaceEnv
        },
        {
          if: 'nav.canNavigateTo("settings")',
          sref: 'spaces.detail.settings.content_preview.list',
          rootSref: 'spaces.detail.settings.content_preview',
          dataViewType: 'spaces-settings-content-preview',
          title: 'Content preview',
          reload: useSpaceEnv
        },
        {
          if: 'nav.usageEnabled && nav.canNavigateTo("settings")',
          sref: 'spaces.detail.settings.usage',
          dataViewType: 'spaces-settings-usage',
          title: 'Usage',
          reload: useSpaceEnv
        }
      ]
    }
  ]);
}
