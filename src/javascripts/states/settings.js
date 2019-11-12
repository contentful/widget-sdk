import SpaceSettingsBase from 'states/SpaceSettingsBase';
import localesSettingsState from 'app/settings/locales/routes/index';
import environmentsSettingsState from 'app/SpaceSettings/Environments/routes/index';
import spaceUsageState from 'app/SpaceSettings/Usage/SpaceUsageState';
import extensionsSettingsState from 'app/settings/extensions/routes/index';
import webhooksSettingsState from 'app/settings/webhooks/routes/index';
import contentPreviewSettingsState from 'app/settings/content_preview/routes/index';
import rolesPermissionsSettingsState from 'app/settings/roles_permissions/routes/index';
import usersSettingsState from './settingsUsers';
import teamsSettingsState from './settingsTeams';
import SpaceSettingsRoute from 'app/settings/space/SpaceSettingsRoute';

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
