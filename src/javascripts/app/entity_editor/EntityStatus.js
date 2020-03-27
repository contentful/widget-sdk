/*
   This function operates on legacy client entity objects.
   For raw CMA entity objects we use `EntityState`.
*/

export function getProps(entity) {
  let label;
  let type;

  if (entity.isPublished()) {
    label = entity.hasUnpublishedChanges() ? 'updated' : 'published';
    type = entity.hasUnpublishedChanges() ? 'primary' : 'positive';
  } else if (entity.isArchived()) {
    label = 'archived';
    type = 'negative';
  } else {
    label = 'draft';
    type = 'warning';
  }

  return {
    children: label,
    tagType: type,
  };
}
