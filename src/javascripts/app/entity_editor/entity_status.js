'use strict';

angular.module('cf.app').factory('entityStatus', [
  () => {
    const PREFIX = 'entity-status--';

    return {
      getClassname: getClassname,
      getLabel: getLabel
    };

    function getClassname(entity) {
      return PREFIX + getLabel(entity);
    }

    function getLabel(entity) {
      if (entity.isPublished()) {
        return entity.hasUnpublishedChanges() ? 'updated' : 'published';
      } else if (entity.isArchived()) {
        return 'archived';
      } else {
        return 'draft';
      }
    }
  }
]);
