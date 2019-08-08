import _ from 'lodash';

import { stateName, getState } from 'data/CMA/EntityState.es6';

import { getModule } from 'NgRegistry.es6';

export function fetchEntities({ entryIds, assetIds }) {
  return Promise.all([
    fetchEntitiesWithIds('Entry', entryIds),
    fetchEntitiesWithIds('Asset', assetIds)
  ]);
}

async function fetchEntitiesWithIds(type, ids) {
  const spaceContext = getModule('spaceContext');
  const EntityResolver = getModule('data/CMA/EntityResolver.es6');

  const entityResolver = EntityResolver.forType(type, spaceContext.cma);

  const results = await entityResolver.load(ids);

  return results.map(([, entity]) => entity);
}

export async function getEntityData(entity, localeCode) {
  const EntityHelpers = getModule('EntityHelpers');
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
