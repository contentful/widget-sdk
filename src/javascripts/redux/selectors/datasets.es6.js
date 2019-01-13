import { get, difference, isEmpty } from 'lodash';
import { mapValues, update } from 'lodash/fp';
import { createSelector } from 'reselect';

import getOrgId from './getOrgId.es6';
import { getRequiredDataSets } from '../routes.es6';
import { getPath } from './location.es6';

const getRawDatasets = state => get(state, ['datasets', 'payload', getOrgId(state)], {});

function resolveLinks(datasets) {
  return entity =>
    update(
      'sys',
      mapValues(potentialLink => {
        if (get(potentialLink, 'sys.type') === 'Link') {
          const { linkType, id } = potentialLink.sys;
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
  // needs deep value mapping, because datasets are nested by orgId and their name
  datasets => mapValues(mapValues(resolveLinks(datasets)), datasets)
);

export const getMeta = state => get(state, ['datasets', 'meta', getOrgId(state)]);

export const getDataSetsToLoad = state => {
  const requiredDatasets = getRequiredDataSets(getPath(state));
  const datasetsMeta = getMeta(state);
  return requiredDatasets.filter(datatset => !get(datasetsMeta, [datatset, 'pending']));
};

export const isLoadingMissingDatasets = state => {
  const datasetsToLoad = getDataSetsToLoad(state);
  const datasetsInState = Object.keys(getRawDatasets(state));
  return !isEmpty(difference(datasetsToLoad, datasetsInState));
};
