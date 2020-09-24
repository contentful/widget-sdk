import * as TokenStore from 'services/TokenStore';
import * as HostnameTransformer from '@contentful/hostname-transformer';
import { isSecureAssetUrl } from '@contentful/field-editor-file';

/**
 * Given a URL on the 'assets.contentful.com' or
 * 'images.contentful.com' domain we replace the host with the images
 * host configured for the organization.
 *
 * @params {string} url
 * @returns {string}
 */
export function getExternalImageUrl(url) {
  if (isSecureAssetUrl(url)) {
    return url;
  }
  const domains = TokenStore.getDomains();
  const internalUrl = HostnameTransformer.toInternal(url, domains);
  domains.assets = domains.images;
  return HostnameTransformer.toExternal(internalUrl, domains);
}
