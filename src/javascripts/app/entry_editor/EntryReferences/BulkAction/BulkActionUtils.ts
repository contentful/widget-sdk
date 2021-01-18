import type { PublishableEntity } from '@contentful/types';

export interface ReferencesResponse {
  sys?: {
    type: 'Array';
  };
  items: PublishableEntity[];
  includes: {
    Asset: PublishableEntity[];
    Entry: PublishableEntity[];
  };
}

/**
 * Given a list of selected Entities, this function will attempt to
 * retrieve updated versions from the entries/:id/references response.
 * This is useful since BulkActions API relies on the version
 * being explicitly set in the POST /publish endpoint.
 * */
export function getUpdatedSelectedEntities(
  selected: PublishableEntity[],
  referencesResponse: ReferencesResponse
): PublishableEntity[] {
  const allEntities = [
    ...referencesResponse.includes.Asset,
    ...referencesResponse.includes.Entry,
    ...referencesResponse.items,
  ];
  const selectedIds = selected.map((selectedEntity) => selectedEntity.sys.id);
  const updated = allEntities.filter((updatedEntity) => selectedIds.includes(updatedEntity.sys.id));

  return updated;
}
