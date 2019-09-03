import navBar from 'navigation/templates/NavBar.es6';

export default function spaceNavTemplate(useSpaceEnv, isMaster) {
  const dropdownItems = {
    locales: {
      if: 'nav.canNavigateTo("locales")',
      sref: '{{nav.makeRef("settings.locales.list")}}',
      rootSref: '{{nav.makeRef("settings.locales")}}',
      dataViewType: 'spaces-settings-locales',
      title: 'Locales'
    },
    extensions: {
      if: 'nav.canNavigateTo("extensions")',
      sref: '{{nav.makeRef("settings.extensions.list")}}',
      rootSref: '{{nav.makeRef("settings.extensions")}}',
      dataViewType: 'spaces-settings-extensions',
      title: 'Extensions'
    },
    settings: {
      if: 'nav.canNavigateTo("settings")',
      sref: '{{nav.makeRef("settings.space")}}',
      dataViewType: 'spaces-settings-space',
      title: 'General settings'
    },
    users: {
      if: 'nav.canNavigateTo("users")',
      sref: '{{nav.makeRef("settings.users.list")}}',
      rootSref: '{{nav.makeRef("settings.users")}}',
      dataViewType: 'spaces-settings-users',
      title: 'Users'
    },
    teams: {
      if: 'nav.teamsInSpacesFF && nav.hasOrgTeamFeature && nav.canNavigateTo("teams")',
      sref: '{{nav.makeRef("settings.teams.list")}}',
      rootSref: '{{nav.makeRef("settings.teams")}}',
      dataViewType: 'spaces-settings-teams',
      label: 'new',
      title: 'Teams'
    },
    roles: {
      if: 'nav.canNavigateTo("roles")',
      sref: '{{nav.makeRef("settings.roles.list")}}',
      rootSref: '{{nav.makeRef("settings.roles")}}',
      dataViewType: 'spaces-settings-roles',
      title: 'Roles & permissions'
    },
    environments: {
      if: 'nav.canNavigateTo("environments")',
      sref: '{{nav.makeRef("settings.environments")}}',
      dataViewType: 'spaces-settings-environments',
      title: 'Environments'
    },
    keys: {
      if: 'nav.canNavigateTo("apiKey")',
      sref: '{{nav.makeRef("api.keys.list")}}',
      rootSref: '{{nav.makeRef("api")}}',
      dataViewType: 'spaces-settings-api',
      title: 'API keys'
    },
    webhooks: {
      if: 'nav.canNavigateTo("webhooks")',
      sref: '{{nav.makeRef("settings.webhooks.list")}}',
      rootSref: '{{nav.makeRef("settings.webhooks")}}',
      dataViewType: 'spaces-settings-webhooks',
      title: 'Webhooks'
    },
    previews: {
      if: 'nav.canNavigateTo("previews")',
      sref: '{{nav.makeRef("settings.content_preview.list")}}',
      rootSref: '{{nav.makeRef("settings.content_preview")}}',
      dataViewType: 'spaces-settings-content-preview',
      title: 'Content preview',
      reload: useSpaceEnv
    },
    usage: {
      if: 'nav.usageEnabled && nav.canNavigateTo("usage")',
      sref: '{{nav.makeRef("settings.usage")}}',
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
        sref: '{{nav.makeRef("content_types.list")}}',
        rootSref: '{{nav.makeRef("content_types")}}',
        dataViewType: 'content-type-list',
        icon: 'nav-ct',
        title: 'Content model'
      },
      {
        if: 'nav.canNavigateTo("entry")',
        sref: '{{nav.makeRef("entries.list")}}',
        rootSref: '{{nav.makeRef("entries")}}',
        dataViewType: 'entry-list',
        icon: 'nav-entries',
        title: 'Content'
      },
      {
        if: 'nav.canNavigateTo("asset")',
        sref: '{{nav.makeRef("assets.list")}}',
        rootSref: '{{nav.makeRef("assets")}}',
        dataViewType: 'asset-list',
        icon: 'nav-media',
        title: 'Media'
      },
      /**
       * Define three independent tiles for navigation to apps so we can
       * display apps alpha navigation item without label if the LD flag for apps beta has
       * not been loaded to avoid too much jitter. Add alpha label after load
       * of ld flag has finished and evaluated to off.
       *
       * Beta has no flag.
       */
      {
        if:
          '!nav.appsBetaLDFlagLoaded && (nav.canNavigateTo("apps") || nav.canNavigateTo("appsAlpha"))',
        dataViewType: 'apps',
        icon: 'nav-apps',
        sref: '{{nav.makeRef("appsAlpha.list")}}',
        rootSref: '{{nav.makeRef("appsAlpha")}}',
        title: 'Apps'
      },
      {
        if: 'nav.appsBetaLDFlagLoaded && nav.appsBetaEnabled && nav.canNavigateTo("apps")',
        dataViewType: 'apps',
        icon: 'nav-apps',
        sref: '{{nav.makeRef("apps.list")}}',
        rootSref: '{{nav.makeRef("apps")}}',
        title: 'Apps'
      },
      {
        if: 'nav.appsBetaLDFlagLoaded && !nav.appsBetaEnabled && nav.canNavigateTo("appsAlpha")',
        dataViewType: 'apps',
        icon: 'nav-apps',
        label: 'alpha',
        sref: '{{nav.makeRef("appsAlpha.list")}}',
        rootSref: '{{nav.makeRef("appsAlpha")}}',
        title: 'Apps'
      },
      {
        if:
          'nav.canNavigateTo("settings") || nav.canNavigateTo("apiKey") || nav.canNavigateTo("environments")',
        dataViewType: 'space-settings',
        rootSref: '{{nav.makeRef("settings")}}',
        icon: 'nav-settings',
        title: useSpaceEnv ? 'Settings' : 'Space settings',
        children: useSpaceEnv ? envSettingsDropdown : spaceSettingsDropdown
      }
    ].filter(item => typeof item === 'object'),
    showQuickNavigation
  );
}
