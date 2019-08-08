import { chunk } from 'lodash';

/**
 * Given an URL, this function returns an abstract endpoint path.
 * E.g. passing 'https://api.contentful.com/spaces/spaceId/entries/entryId'
 * would result in '/entries/:id'.
 *
 * Rules:
 *  - Returns path part of a CMA url, replaces IDs (each 2nd path piece) with `:id`
 *  - May return `/space/:id`, or `/environments/:id` but returned string never includes
 *    these as prefixes.
 *  - May return `/:entity/:id` as a prefix in specific cases (comments) and in other
 *    case ignore anything after the 2nd part of the path.
 *
 * @param {string} url
 * @returns {string}
 */
export function getEndpoint(url) {
  const segments = url
    .split('?')[0]
    .split('/')
    .slice(3);

  const relevantSegments =
    segments.length > 4 && segments[2] === 'environments'
      ? segments.slice(4)
      : segments.length > 2 && segments[0] === 'spaces'
      ? segments.slice(2)
      : segments;
  return makeStableName(relevantSegments);
}

function makeStableName(relevantSegments) {
  const chunks = chunk(relevantSegments, 2);

  const getPath = idx => `/${chunks[idx][0]}`;
  const getId = idx => (chunks[idx][1] ? '/:id' : '');
  // See app/entity_editor/NoShareJsCmaFakeRequestsExperiment.es6.js for experiment info:
  const getExperiment = idx =>
    idx + 1 === chunks.length && getPath(idx).match(/\.php$/) ? getPath(idx) : '';

  if (chunks[1] && getPath(1) === '/comments') {
    return `/:entity/:id/comments${getId(1)}`;
  } else {
    return `${getPath(0)}${getId(0)}${getExperiment(1)}`;
  }
}
