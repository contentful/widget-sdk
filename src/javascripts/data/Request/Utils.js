import { chunk } from 'lodash';
import { getCurrentStateName } from 'states/Navigator';

/**
 * Returns the current state name from `angular-ui-router`.
 *
 * By default, it uses the state name as provided by `getCurrentStateName`
 * from `states/Navigator`. However, when the app first loads, there is no
 * state name in Angular yet, and so we use the special key `__INITIAL_LOAD__`
 * to denote that the current state (and the current request) occur before
 * we've finally navigated to the first state e.g. spaces.detail.home.
 *
 * @return {string}
 */
export function getCurrentState() {
  const currentState = getCurrentStateName();

  if (currentState === '') {
    return '__INITIAL_LOAD__';
  }
  return currentState;
}

// Paths that can be below /organizations/... or /spaces/... that we want to track as /:orgOrSpace/...
const ORG_OR_SPACE_PATHS = ['/product_catalog_features'];

// Paths that can be below /entries/... or /assets/... that we want to track as /:entity/...
const ENTITY_PATHS = ['/tasks', '/comments', '/snapshots', '/references'];

// E.g. "/content_types/:id/editor_interface"
const SECOND_LEVEL_PATHS = {
  '/content_types': ['/editor_interface'],
  '/:orgOrSpace': ORG_OR_SPACE_PATHS,
  '/:entity': ENTITY_PATHS,
};

/**
 * Given an URL, this function returns an abstract endpoint path.
 * E.g. passing 'https://api.contentful.com/spaces/spaceId/entries/entryId'
 * would result in '/entries/:id'.
 *
 * Rules:
 *  - Returns path part of a CMA url, replaces IDs (each 2nd path piece) with `:id`
 *  - May return `/space/:id`, or `/environments/:id` but returned string never includes
 *    these as prefixes. May return `/:orgOrSpace/:id/...` instead in some cases.
 *  - May return `/:entity/:id` as a prefix in specific cases (comments) and in other
 *    case ignore anything after the 2nd part of the path.
 *
 * @param {string} url
 * @returns {string}
 */
export function getEndpoint(url) {
  const allSegments = url.split('?')[0].split('/').slice(3);

  const segments =
    allSegments.length > 4 && allSegments[2] === 'environments'
      ? [...allSegments.slice(0, 2), ...allSegments.slice(4)] // Remove /environments/:id part.
      : allSegments;

  if (
    segments.length > 2 &&
    ['organizations', 'spaces'].includes(segments[0]) &&
    ORG_OR_SPACE_PATHS.includes(`/${segments[2]}`)
  ) {
    return makeStableName([':orgOrSpace', ...segments.slice(1)]);
  }
  if (segments.length > 2 && segments[0] === 'spaces') {
    if (['entries', 'assets'].includes(segments[2]) && ENTITY_PATHS.includes(`/${segments[4]}`)) {
      return makeStableName([':entity', ...segments.slice(3)]);
    }
    return makeStableName(segments.slice(2));
  }
  return makeStableName(segments);
}

function makeStableName(segments) {
  const chunks = chunk(segments, 2);

  const getPath = (idx) => `/${chunks[idx][0]}`;
  const getId = (idx) => (chunks[idx][1] ? '/:id' : '');

  const path = getPath(0);
  const id = getId(0);

  if (
    chunks.length > 1 &&
    SECOND_LEVEL_PATHS[path] &&
    SECOND_LEVEL_PATHS[path].includes(getPath(1))
  ) {
    return `${path}${id}${getPath(1)}${getId(1)}`;
  }
  return `${path}${id}`;
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
