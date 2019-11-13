import { get, isEmpty, difference } from 'lodash';
import { mapValues, update } from 'lodash/fp';
import { createSelector } from 'reselect';

import getOrgId from './getOrgId';
import getRequiredDatasets from './getRequiredDatasets';
import { hasAccess } from './access';

/**
 * @description
 * Returns all datasets of the given org as nested map; keyed by dataset name constant first, then by dataset item ids
 *
 * {
 *   USERS: {
 *     userId1: user1,
 *     userId2: user2,
 *     ...
 *   }
 * }
 *
 * This will not resolve link.
 * If no orgId is given, the current org is used.
 *
 * @returns {obj}
 */
export const getRawDatasets = (state, props) =>
  get(state, ['datasets', 'payload', get(props, 'orgId', getOrgId(state))], {});

// datasets will not be requested more often than this value
const MAX_AGE = 10 * 1000;

// this replaces all links with actual data if that data is loaded
// will work recursively
// if used with a state listener (e.g. `connect` from `react-redux`), will update when more data was loaded later
function resolveLinks(datasets) {
  return entity =>
    update(
      'sys',
      mapValues(potentialLink => {
        if (get(potentialLink, 'sys.type') === 'Link') {
          const { linkType, id } = potentialLink.sys;
          // checks if link target is loaded
          if (linkType in datasets && id in datasets[linkType]) {
            const entity = datasets[linkType][id];
            return resolveLinks(datasets)(entity);
          }
        }
        return potentialLink;
      }),
      entity
    );
}

/**
 * @description
 * Returns all datasets of the current org as nested map; keyed by dataset name constant first, then by dataset item ids
 *
 * {
 *   USERS: {
 *     userId1: user1,
 *     userId2: user2,
 *     ...
 *   }
 * }
 *
 * Returns structure of redux store, which can be expected with redux dev tools.
 *
 * This will also resolve links, given
 * - the link type equals the dataset constant (e.g. USERS => `User`, corresponds with `{ linkType: User }`)
 * - the dataset the link points to is loaded (this will update if it's loaded later because it's `redux`)
 * - the link is in `sys` (e.g. org memeberships have a duplicated `user` link outside `sys` for some reason and that will not be resolved)

 * @returns {obj}
 */
export const getDatasets = createSelector(
  [getRawDatasets],
  // needs nested value mapping because datasets are nested by orgId and their name
  datasets => mapValues(mapValues(resolveLinks(datasets)), datasets)
);

/**
 * @description
 * Returns meta information about datasets
 *
 * Mostly for internal use of the fetching mechanism.
 * Inspect with redux dev tools for details.
 *
 * @returns {obj}
 */
export const getMeta = state => get(state, ['datasets', 'meta', getOrgId(state)]);

// gets all datasets that have to be loaded for the current location
// given the new route, the loaded datasets and the age of the loaded datasets
export const getDataSetsToLoad = (state, { now } = { now: Date.now() }) => {
  const requiredDatasets = getRequiredDatasets(state);
  const datasetsMeta = getMeta(state);
  return requiredDatasets.filter(datatset => {
    const lastFetchedAt = get(datasetsMeta, [datatset, 'fetched']);
    return (
      (!lastFetchedAt || now - lastFetchedAt > MAX_AGE) && !get(datasetsMeta, [datatset, 'pending'])
    );
  });
};

/**
 * @description
 * Components should use this to show spinner and decide if they should render children which might depend on loaded datasets
 *
 * This will also be true in case of an error.
 * Errors are currently not distinguishable, as there is no recovery for failed loading of datasets and it has to be treated as a bug (fail fast).
 *
 * @returns {boolean}
 **/
export const isMissingRequiredDatasets = state => {
  if (!hasAccess(state)) {
    return false;
  }
  const requiredDatasets = getRequiredDatasets(state);
  // required datasets couldn't be determined yet
  if (requiredDatasets === null || requiredDatasets.includes(null)) {
    return true;
  }
  const datasetsInState = Object.keys(getDatasets(state));
  return !isEmpty(difference(requiredDatasets, datasetsInState));
};
