'use strict';

const _ = require('lodash');
const dateStringToIso = require('./utils').dateStringToIso;

module.exports = function mixinPublishable (base) {
  return _.extend(base, {

    publish: function (version) {
      if (typeof version === 'undefined') {
        version = this.getVersion();
      }

      return this.endpoint('published')
        .headers({'X-Contentful-Version': version})
        .put()
        .then(this.handleUpdate);
    },

    unpublish: function () {
      return this.endpoint('published').delete()
        .then(this.handleUpdate);
    },

    getPublishedVersion: function () {
      return this.getSys() && this.data.sys.publishedVersion;
    },

    getPublishedAt: function () {
      return this.getSys() &&
             this.data.sys.publishedAt &&
             dateStringToIso(this.data.sys.publishedAt);
    },

    setPublishedVersion: function (version) {
      if (this.getSys()) { this.data.sys.publishedVersion = version; }
    },

    getPublishedState: function () {
      return this.endpoint('published').get();
    },

    isPublished: function () {
      return !!this.getPublishedVersion();
    },

    hasUnpublishedChanges: function () {
      return !this.isPublished() || this.data.sys.version > this.data.sys.publishedVersion + 1;
    },

    canPublish: function () {
      return !this.isDeleted() && (!this.getPublishedVersion() || this.hasUnpublishedChanges());
    },

    canUnpublish: function () {
      return this.isPublished();
    },

    canDelete: function () {
      return !this.isDeleted() && !this.isPublished();
    }
  });
};
