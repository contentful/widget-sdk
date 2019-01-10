import { get } from 'lodash';
import { mapValues, update } from 'lodash/fp';
import { createSelector } from 'reselect';

import getOrgId from './getOrgId.es6';

const getRawDatasets = state => get(state, ['datasets', getOrgId(state)], {});

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

export default createSelector(
  [getRawDatasets],
  datasets => mapValues(mapValues(resolveLinks(datasets)), datasets)
);
