'use strict';

const _ = require('lodash');

module.exports = function mixinPublishable(base) {
  return _.extend(base, {
    archive: function() {
      return this.endpoint('archived')
        .put()
        .then(this.handleUpdate);
    },

    unarchive: function() {
      return this.endpoint('archived')
        .delete()
        .then(this.handleUpdate);
    },

    isArchived: function() {
      return !this.isDeleted() && !!this.data.sys.archivedVersion;
    },

    canArchive: function() {
      return !this.isArchived() && !this.isPublished();
    },

    canUnarchive: function() {
      return this.isArchived();
    },

    canPublish: function() {
      return (
        !this.isDeleted() &&
        !this.isArchived() &&
        (!this.getPublishedVersion() || this.hasUnpublishedChanges())
      );
    }
  });
};
