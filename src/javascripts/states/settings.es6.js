import SpaceSettingsBase from 'states/SpaceSettingsBase.es6';
import localesSettingsState from 'app/settings/locales/routes/index.es6';
import environmentsSettingsState from 'app/SpaceSettings/Environments/State.es6';
import spaceUsageState from 'app/SpaceSettings/Usage/SpaceUsageState.es6';
import extensionsSettingsState from 'app/settings/extensions/routes/index.es6';
import webhooksSettingsState from 'app/settings/webhooks/routes/index.es6';
import contentPreviewSettingsState from 'app/settings/content_preview/routes/index.es6';
import rolesSettingsState from './settingsRoles.es6';
import usersSettingsState from './settingsUsers.es6';

export default SpaceSettingsBase({
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
