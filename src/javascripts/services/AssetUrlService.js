import hostnameTransformer from '@contentful/hostname-transformer';
import * as TokenStore from 'services/TokenStore';
import { isSecureAssetUrl } from 'utils/AssetUrl';

/**
 * Asset URLs are always hardcoded to the host `TYPE.contentful.com`.
 * This filter transforms URL hosts by using information from the
 * `/token` endpoint. The token has a domain map mapping `TYPE` to the
 * actual domain. This is used to replace the hosts.
 */
export function transformHostname(assetOrUrl) {
  if (isSecureAssetUrl(assetOrUrl)) {
    return assetOrUrl;
  }
  const domains = TokenStore.getDomains();
  if (domains) {
    return hostnameTransformer.toExternal(assetOrUrl, domains);
  } else {
    return assetOrUrl;
  }
}
