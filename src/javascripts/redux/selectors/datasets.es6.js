import { get, isEmpty, difference } from 'lodash';
import { mapValues, update } from 'lodash/fp';
import { createSelector } from 'reselect';

import getOrgId from './getOrgId.es6';
import getRequiredDatasets from './getRequiredDatasets.es6';
import { hasAccess } from './access.es6';

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

export const getDatasets = createSelector(
  [getRawDatasets],
  // needs nested value mapping because datasets are nested by orgId and their name
  datasets => mapValues(mapValues(resolveLinks(datasets)), datasets)
);

// get's meta information about datasets, e.g. if they've been optimistically updated (pending server request)
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

/** @brief Components should use this to show spinner and decide if they should render children which might depend on loaded datasets

 This will also be true in case of an error.
 Errors are currently not distinguishable, as there is no recovery for failed loading of datasets and it has to be treated as a bug (fail fast).
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
