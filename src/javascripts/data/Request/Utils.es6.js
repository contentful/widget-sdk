/**
 * Given an URL, this function returns an abstract endpoint path.
 * E.g. passing 'https://api.contentful.com/spaces/spaceId/entries/entryId'
 * would result in '/entries/:id'.
 *
 * @param url
 * @returns {string}
 */
export function getEndpoint(url) {
  const segments = url
    .split('?')[0]
    .split('/')
    .slice(3);
  const getId = idx => (segments[idx] ? '/:id' : '');
  // See app/entity_editor/NoShareJsCmaFakeRequestsExperiment.es6.js for experiment info:
  const getExperiment = idx => {
    if (idx + 1 < segments.length) return '';
    if ((segments[idx] || '').match(/.php$/)) return '/' + segments[idx];
    return '';
  };
  const makeStableName = idx => `/${segments[idx]}${getId(idx + 1)}${getExperiment(idx + 2)}`;

  if (segments.length <= 2) {
    return `/${segments.join('/')}`;
  }

  if (segments[2] === 'environments' && segments.length > 3) {
    return makeStableName(4);
  } else {
    return makeStableName(2);
  }
}
