import { accountUrl } from 'Config';
import { startsWith } from 'lodash';

export function getGatekeeperUrl(pathname: string) {
  const baseUrl = '/account';

  if (!startsWith(pathname, baseUrl)) {
    return null;
  }

  let gkUrl = pathname.replace(baseUrl, '');
  // ui router escapes slashes in path suffix, we have to unescape them
  gkUrl = decodeURIComponent(gkUrl);
  return accountUrl(gkUrl);
}
