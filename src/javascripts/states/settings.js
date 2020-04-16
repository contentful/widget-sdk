import SpaceSettingsBase from 'states/SpaceSettingsBase';
import localesSettingsState from 'app/settings/locales/routes';
import environmentsSettingsState from 'app/SpaceSettings/Environments/routes';
import spaceUsageState from 'app/SpaceSettings/Usage/SpaceUsageState';
import extensionsSettingsState from 'app/settings/extensions/routes';
import webhooksSettingsState from 'app/settings/webhooks/routes';
import contentPreviewSettingsState from 'app/settings/content_preview/routes';
import rolesPermissionsSettingsState from 'app/settings/roles_permissions/routes';
import usersSettingsState from './settingsUsers';
import teamsSettingsState from './settingsTeams';
import { SpaceSettingsRoute } from 'features/space-settings';
import tagsSettingsState from 'app/settings/content_tags/routes';

export default SpaceSettingsBase({
  name: 'settings',
  url: '/settings',
  abstract: true,
  children: [
    {
      name: 'space',
      url: '/space',
      component: SpaceSettingsRoute,
    },
    localesSettingsState,
    usersSettingsState,
    teamsSettingsState,
    rolesPermissionsSettingsState,
    contentPreviewSettingsState,
    environmentsSettingsState,
    spaceUsageState,
    extensionsSettingsState,
    webhooksSettingsState,
    tagsSettingsState,
  ],
});
