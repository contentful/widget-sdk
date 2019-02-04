import { registerFactory } from 'NgRegistry.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name states/settings
   */
  registerFactory('states/settings', [
    'states/settings/users',
    'states/settings/roles',
    'states/SpaceSettingsBase.es6',
    'app/settings/locales/routes/index.es6',
    'app/SpaceSettings/Environments/State.es6',
    'app/SpaceSettings/Usage/SpaceUsageState.es6',
    'app/settings/extensions/routes/index.es6',
    'app/settings/webhooks/routes/index.es6',
    'app/settings/content_preview/routes/index.es6',
    (
      usersSettingsState,
      rolesSettingsState,
      { default: SpaceSettingsBase },
      { default: localesSettingsState },
      { default: environmentsSettingsState },
      { default: spaceUsageState },
      { default: extensionsSettingsState },
      { default: webhooksSettingsState },
      { default: contentPreviewSettingsState }
    ) => {
      return SpaceSettingsBase({
        name: 'settings',
        url: '/settings',
        abstract: true,
        children: [
          {
            name: 'space',
            url: '/space',
            template: '<react-component name="app/settings/space/SpaceSettingsRoute.es6" />'
          },
          localesSettingsState,
          usersSettingsState,
          rolesSettingsState,
          contentPreviewSettingsState,
          environmentsSettingsState,
          spaceUsageState,
          // Note: app/api/State is in the "Settings" menu but is not a child here.
          extensionsSettingsState,
          webhooksSettingsState
        ]
      });
    }
  ]);
}
