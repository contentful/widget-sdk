import * as TokenStore from 'services/TokenStore';
import * as HostnameTransformer from 'hostnameTransformer';

/*
 * Checks whether the passed content type matches one of our valid MIME types
 *
 * @params {string} fileContentType
 * @returns {boolean}
 */
export function isValidImage(fileContentType) {
  const validMimeTypes = [
    'image/bmp',
    'image/x-windows-bmp',
    'image/gif',
    // This is not a valid MIME type but we supported it in the past.
    'image/jpg',
    'image/jpeg',
    'image/pjpeg',
    'image/x-jps',
    'image/png',
    'image/svg+xml'
  ];

  return validMimeTypes.indexOf(fileContentType) > -1;
}

/**
 * Given a URL on the 'assets.contentful.com' or
 * 'images.contentful.com' domain we replace the host with the images
 * host configured for the organization.
 *
 * @params {string} url
 * @returns {string}
 */
export function getExternalImageUrl(url) {
  const domains = TokenStore.getDomains();
  const internalUrl = HostnameTransformer.toInternal(url, domains);
  domains.assets = domains.images;
  return HostnameTransformer.toExternal(internalUrl, domains);
}
