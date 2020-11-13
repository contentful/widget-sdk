import { go } from 'states/Navigator';

export function jumpToRole(roleName, isMasterEnvironment) {
  if (isMasterEnvironment) {
    go({ path: 'spaces.detail.settings.users.list', params: { jumpToRole: roleName } });
  } else {
    go({ path: 'spaces.detail.environment.settings.users.list', params: { jumpToRole: roleName } });
  }
}
