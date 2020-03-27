import { stateName, getState } from 'data/CMA/EntityState';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';

export async function getEntityData(entity, localeCode) {
  const entityHelpers = EntityHelpers.newForLocale(localeCode);

  const [title, description, file, status] = await Promise.all([
    entityHelpers.entityTitle(entity),
    entityHelpers.entityDescription(entity),
    entityHelpers.entityFile(entity),
    stateName(getState(entity.sys)),
  ]);

  return {
    title,
    description,
    file,
    status,
  };
}
