import { executeBulkAction } from '../referencesService';
import type { PublishableEntity } from '@contentful/types';

type VersionedLink = {
  sys: {
    id: string;
    linkType: string;
    type: 'Link';
    version: number;
  };
};

const linkWithVersion = (entity: PublishableEntity): VersionedLink => {
  return {
    sys: {
      id: entity.sys.id,
      linkType: entity.sys.type,
      type: 'Link',
      version: entity.sys.version,
    },
  };
};

/**
 * Check if an entity exists in a given list of Entities (by id and type)
 **/
const entityIsIncluded = (entitiesList: VersionedLink[], entity: PublishableEntity) => {
  return entitiesList.some((e) => e.sys.id === entity.sys.id && e.sys.type === entity.sys.type);
};

const mapEntities = (entities: PublishableEntity[]): VersionedLink[] => {
  const uniqEntities: VersionedLink[] = [];

  entities.forEach((entity) => {
    const alreadyIncluded = entityIsIncluded(uniqEntities, entity);

    if (!alreadyIncluded) uniqEntities.push(linkWithVersion(entity));
  });

  return uniqEntities;
};

const publishBulkAction = async (entities) => {
  const entitiesToPublish = mapEntities(entities);

  return executeBulkAction({ entities: entitiesToPublish, action: 'publish' });
};

export { publishBulkAction };
