import SpaceSettingsBase from 'states/SpaceSettingsBase.es6';
import localesSettingsState from 'app/settings/locales/routes/index.es6';
import environmentsSettingsState from 'app/SpaceSettings/Environments/routes/index.es6';
import spaceUsageState from 'app/SpaceSettings/Usage/SpaceUsageState.es6';
import extensionsSettingsState from 'app/settings/extensions/routes/index.es6';
import webhooksSettingsState from 'app/settings/webhooks/routes/index.es6';
import contentPreviewSettingsState from 'app/settings/content_preview/routes/index.es6';
import rolesPermissionsSettingsState from 'app/settings/roles_permissions/routes/index';
import usersSettingsState from './settingsUsers.es6';
import teamsSettingsState from './settingsTeams.es6';
import SpaceSettingsRoute from 'app/settings/space/SpaceSettingsRoute.es6';

export default SpaceSettingsBase({
  name: 'settings',
  url: '/settings',
  abstract: true,
  children: [
    {
      name: 'space',
      url: '/space',
      component: SpaceSettingsRoute
    },
    localesSettingsState,
    usersSettingsState,
    teamsSettingsState,
    rolesPermissionsSettingsState,
    contentPreviewSettingsState,
    environmentsSettingsState,
    spaceUsageState,
    extensionsSettingsState,
    webhooksSettingsState
  ]
});
