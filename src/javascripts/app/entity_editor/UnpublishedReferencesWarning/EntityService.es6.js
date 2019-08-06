import _ from 'lodash';
import * as EndpointFactory from 'data/EndpointFactory.es6';
import { stateName, getState } from 'data/CMA/EntityState.es6';

import { getModule } from 'NgRegistry.es6';
const EntityHelpers = getModule('EntityHelpers');

export function fetchEntities({ spaceId, environmentId, entryIds, assetIds }) {
  const spaceEndpoint = EndpointFactory.createSpaceEndpoint(spaceId, environmentId);
  return Promise.all([
    fetchEntitiesWithIds(spaceEndpoint, 'Entry', entryIds),
    fetchEntitiesWithIds(spaceEndpoint, 'Asset', assetIds)
  ]);
}

async function fetchEntitiesWithIds(endpoint, type, ids) {
  if (ids.length === 0) {
    return [];
  }
  let path;
  if (type === 'Entry') {
    path = ['entries'];
  } else {
    path = ['assets'];
  }

  const result = await endpoint({
    method: 'GET',
    path,
    query: {
      'sys.id[in]': _.uniq(ids).join(',')
    }
  });

  return result.items;
}

export async function getEntityData(entity, localeCode) {
  const entityHelpers = EntityHelpers.newForLocale(localeCode);

  const [title, description, file, status] = await Promise.all([
    entityHelpers.entityTitle(entity),
    entityHelpers.entityDescription(entity),
    entityHelpers.entityFile(entity),
    stateName(getState(entity.sys))
  ]);

  return {
    title,
    description,
    file,
    status
  };
}
