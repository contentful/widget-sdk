const PREFIX = 'entity-status--';

export function getClassname(entity) {
  return PREFIX + getLabel(entity);
}

export function getLabel(entity) {
  if (entity.isPublished()) {
    return entity.hasUnpublishedChanges() ? 'updated' : 'published';
  } else if (entity.isArchived()) {
    return 'archived';
  } else {
    return 'draft';
  }
}
