import SpaceSettingsBase from 'states/SpaceSettingsBase';
import environmentsSettingsState from 'app/SpaceSettings/Environments/routes';
import spaceUsageState from 'app/SpaceSettings/Usage/SpaceUsageState';
import { extensionsSettingsState } from './settingsExtensions';
import { webhooksRouteState } from './settingsWebhooks';
import { contentPreviewState } from './settingsContentPreview';
import { rolesPermissionsSettingsState } from './settingsRolesPermissions';
import { localesSettingsState } from './settingsLocales';
import { usersSettingsState } from './settingsUsers';
import teamsSettingsState from './settingsTeams';
import { SpaceSettingsRoute } from 'features/space-settings';
import { tagsState } from 'features/content-tags';

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
    contentPreviewState,
    environmentsSettingsState,
    spaceUsageState,
    extensionsSettingsState,
    webhooksRouteState,
    tagsState,
  ],
});
