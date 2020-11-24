import { chunk } from 'lodash';
import { getCurrentStateName } from 'states/Navigator';

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
  const segments = url.split('?')[0].split('/').slice(3);

  const relevantSegments =
    segments.length > 4 && segments[2] === 'environments'
      ? segments.slice(4)
      : segments.length > 2 && segments[0] === 'spaces'
      ? segments.slice(2)
      : segments;
  return makeStableName(relevantSegments);
}

/*
  Returns the current state name from `angular-ui-router`.

  By default, it uses the state name as provided by `getCurrentStateName`
  from `states/Navigator`. However, when the app first loads, there is no
  state name in Angular yet, and so we use the special key `__INITIAL_LOAD__`
  to denote that the current state (and the current request) occur before
  we've finally navigated to the first state e.g. spaces.detail.home.
 */

export function getCurrentState() {
  const currentState = getCurrentStateName();

  if (currentState === '') {
    return '__INITIAL_LOAD__';
  }

  return currentState;
}

// E.g. "/entry/:id/tasks/:id" will be tracked as "/:entity/:id/tasks/:id"
const RELEVANT_ENTITY_PATHS = ['/tasks', '/comments', '/snapshots'];
// E.g. "/content_types/:id/editor_interface"
const SECOND_LEVEL_PATHS = {
  '/content_types': ['/editor_interface'],
};

function makeStableName(relevantSegments) {
  const chunks = chunk(relevantSegments, 2);

  const getPath = (idx) => `/${chunks[idx][0]}`;
  const getId = (idx) => (chunks[idx][1] ? '/:id' : '');

  if (chunks[1] && RELEVANT_ENTITY_PATHS.includes(getPath(1))) {
    return `/:entity/:id${getPath(1)}${getId(1)}`;
  } else {
    const path = getPath(0);
    const id = getId(0);

    if (chunks[1] && SECOND_LEVEL_PATHS[path] && SECOND_LEVEL_PATHS[path].includes(getPath(1))) {
      return `${path}${id}${getPath(1)}${getId(1)}`;
    }
    return `${path}${id}`;
  }
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
