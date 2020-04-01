/**
 * It adds utm paramters to the given URL.
 * It expects at least `source`, `medium` and `campaign` parameters to the `utmParams`.
 * `term` and `content` are optional.
 * It keeps existing query parameters and hashes.
 * It overrides existing utm parameters with the same property name.
 * If the given url starts with `//`, it will append `http:` at the beginning to make it valid for the URL constructor
 *
 * @param {Object} utmParams The utm parameter object without `utm_`
 *
 * @returns Another function which expects an URL as String
 *
 * @example
 * const utmTo = buildUrlWithUtmParams({
 *  source: 'newsletter',
 *  medium: 'email',
 *  campaign: 'contentful-anniversary',
 * });
 *
 * utmTo('https://www.contentful.com');
 * utmTo('//www.contentful.com');
 */
export function buildUrlWithUtmParams(utmParams = {}) {
  /**
   * @param {String} currentUrl The URL base to receive the UTM parameters
   */
  return (currentUrl = '') => {
    if (!currentUrl) throw new Error('`currentUrl` is required.');

    const finalUrl = currentUrl.startsWith('//') ? `https:${currentUrl}` : currentUrl;
    const { origin, pathname, searchParams, hash } = new URL(finalUrl); // only IE doesn't support it

    const hasRequiredParams = ['source', 'medium', 'campaign'].every((param) => !!utmParams[param]);
    if (!hasRequiredParams) throw new Error('`source`, `medium` and `campaign` are required.');

    Object.keys(utmParams).forEach((key) => {
      searchParams.set(`utm_${key}`, utmParams[key]); // using `set` instead of `append` to replace values with the same name
    });

    return `${origin}${pathname}?${searchParams.toString()}${hash}`;
  };
}
