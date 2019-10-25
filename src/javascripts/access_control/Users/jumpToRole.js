import { getModule } from 'NgRegistry.es6';
import { go } from 'states/Navigator.es6';

export default function jumpToRole(roleName) {
  const spaceContext = getModule('spaceContext');
  if (spaceContext.isMasterEnvironment()) {
    go({ path: 'spaces.detail.settings.users.list', params: { jumpToRole: roleName } });
  } else {
    go({ path: 'spaces.detail.environment.settings.users.list', params: { jumpToRole: roleName } });
  }
}
