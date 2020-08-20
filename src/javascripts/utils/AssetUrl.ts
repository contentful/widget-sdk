const SECURE_URL_REGEXP = /^(https?:)?\/\/[^.]+\.secure\..+/i;

export function isSecureAssetUrl(url: unknown) {
  return typeof url === 'string' && SECURE_URL_REGEXP.test(url);
}
