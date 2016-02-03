'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name spaceContext
 *
 * @description
 * This service holds all context related to a space, including contentTypes,
 * locales, and helper methods.
 *
 * @property {Client.ContentType[]} contentTypes
 * @property {Client.ContentType[]} publishedContentTypes
 * @property {Client.Space} space
 */
.factory('spaceContext', ['$injector', function($injector){
  var $parse             = $injector.get('$parse');
  var $q                 = $injector.get('$q');
  var $rootScope         = $injector.get('$rootScope');
  var ReloadNotification = $injector.get('ReloadNotification');
  var notification       = $injector.get('notification');
  var logger             = $injector.get('logger');

  var spaceContext = {
    /**
     * @ngdoc method
     * @name spaceContext#resetWithSpace
     * @param {Client.Space} space
     * @description
     * This method resets a space context with a given space
    */
    resetWithSpace: function(space){
      this.space = space;
      this.contentTypes = [];
      this.publishedContentTypes = [];
      this._publishedContentTypesHash = {};
      this._publishedContentTypeIsMissing = {};
      this.refreshContentTypes();
    },

    /**
     * @ngdoc method
     * @name spaceContext#getId
     * @description
     * Returns ID of current space, if set
     * @returns String
     */
    getId: function () {
      return this.space && this.space.getId();
    },

    /**
     * @ngdoc method
     * @name spaceContext#getData
     * @param {string} path
     * @param {*} defaultValue
     * @description
     * Returns nested value stored under `path` in current `space.data`.
     * If not found, returns `defaultValue` (`undefined` when not provided)
     * @returns *
     */
    getData: function (path, defaultValue) {
      var data = dotty.get(this, 'space.data', {});
      return dotty.get(data, path, defaultValue);
    },

    /**
     * @ngdoc method
     * @name spaceContext#refreshContentTypes
     * @description
     * Refreshes all Content Type related information in the context
     */
    // FIXME This is a potential source of a race condition
    // Consider the case where we call `refreshContentTypes()`, then
    // `resetSpace()` and then `refreshContenTypes()` again. If the
    // first query for content types is resolved after the latter
    // one, the space context will have the content types of the
    // wrong space
    refreshContentTypes: function() {
      if (!this.space) {
        this.contentTypes = [];
        this.publishedContentTypes = [];
        this._publishedContentTypesHash = {};
        return $q.when(this.contentTypes);
      }

      if (this.loadingPromise) {
        return this.loadingPromise;
      }

      var self = this;

      this.loadingPromise = this.space.getContentTypes({order: 'name', limit: 1000})
      .then(function (contentTypes) {
        self.contentTypes = filterAndSortContentTypes(contentTypes);
        return refreshPublishedContentTypes(spaceContext).then(function () {
          return contentTypes;
        });
      })
      .catch(ReloadNotification.apiErrorHandler)
      .finally(function () { spaceContext.loadingPromise = null; });

      return this.loadingPromise;
    },

    /**
     * @ngdoc method
     * @name spaceContext#getFilteredAndSortedContentTypes
     * @description
     * Returns a list of content types with deleted ones filtered out
     * and with the content types sorted by name
     * @return {Array<Client.ContentType>}
    */
    getFilteredAndSortedContentTypes: function () {
      return filterAndSortContentTypes(this.contentTypes);
    },

    /**
     * @ngdoc method
     * @name spaceContext#registerPublishedContentType
     * @param {Client.ContentType} contentType
    */
    registerPublishedContentType: function (contentType) {
      if (!this._publishedContentTypesHash[contentType.getId()]) {
        this.publishedContentTypes.push(contentType);
        this._publishedContentTypesHash[contentType.getId()] = contentType;
        $rootScope.$broadcast('contentTypePublished', contentType);
      }
    },

    /**
     * @ngdoc method
     * @name spaceContext#unregisterPublishedContentType
     * @param {Client.ContentType} publishedContentType
    */
    unregisterPublishedContentType: function (publishedContentType) {
      var index = _.indexOf(this.publishedContentTypes, publishedContentType);
      if (index === -1) return;

      this.publishedContentTypes.splice(index, 1);
      this._publishedContentTypesHash = _.omit(this._publishedContentTypesHash, function (ct) {
        return ct === publishedContentType;
      });
      $rootScope.$broadcast('contentTypeUnpublished', publishedContentType);
    },

    /**
     * @ngdoc method
     * @name spaceContext#removeContentType
     * @param {Client.ContentType} contentType
    */
    removeContentType: function(contentType) {
      var index = _.indexOf(this.contentTypes, contentType);
      if (index === -1) return;
      this.contentTypes.splice(index, 1);
      this.refreshContentTypes();
    },

    /**
     * @ngdoc method
     * @name spaceContext#publishedTypeForEntry
     * @param {Client.Entry} entry
     * @return {Client.ContentType}
     * @description
     * Returns the published content type for a given entry
    */
    publishedTypeForEntry: function(entry) {
      var contentTypeId = entry.getContentTypeId();
      return this.getPublishedContentType(contentTypeId);
    },

    /**
     * @ngdoc method
     * @name spaceContext#getPublishedContentType
     * @param {string} contentTypeId
     * @return {Client.ContentType}
     * @description
     * Returns the published content type for a given ID
    */
    getPublishedContentType: function (contentTypeId) {
      var contentType = this._publishedContentTypesHash[contentTypeId];

      if (!contentType && !this._publishedContentTypeIsMissing[contentTypeId]) {
        this._publishedContentTypeIsMissing[contentTypeId] = true;
        this.refreshContentTypes();
      }
      return contentType;
    },

    /**
     * @ngdoc method
     * @name spaceContext#fetchPublishedContentType
     * @param {string} contentTypeId
     * @return Promise<Client.ContentType>
     * @description
     * Returns the promise of published content type for a given ID.
     * Different from getPublishedContentType, it will fetch CT if it's not loaded yet.
     */
    fetchPublishedContentType: function (contentTypeId) {
      var self = this;
      var contentType = pick();
      if (contentType) { return $q.when(contentType); }

      return this.refreshContentTypes().then(pick);

      function pick() {
        return self._publishedContentTypesHash[contentTypeId];
      }
    },

    /**
     * @ngdoc method
     * @name spaceContext#displayFieldForType
     * @param {string} contentTypeId
     * @return {Object}
     * @description
     * Returns the display field for a given content type id
    */
    displayFieldForType: function (contentTypeId) {
      var ct = this.getPublishedContentType(contentTypeId);
      return ct && _.find(ct.data.fields, {id: ct.data.displayField});
    },

    /**
     * @ngdoc method
     * @name spaceContext#localizedField
     * @param {Object} entity
     * @param {Array} path
     * @param {string} localeCode
     * @return {Object}
     * @description
     * Given an entity (entry/asset), and a field path, returns the field
     * content for a given locale
    */
    localizedField: function(entity, path, localeCode) {
      var getField = $parse(path);
      var field = getField(entity);
      var defaultLocale = this.space && this.space.getDefaultLocale();
      var defaultLocaleCode = defaultLocale && defaultLocale.internal_code;
      var firstLocaleCode = _.first(_.keys(field));

      localeCode = localeCode || defaultLocaleCode || firstLocaleCode;

      return field && (field[localeCode] || field[defaultLocaleCode] || field[firstLocaleCode]);
    },

    /**
     * @ngdoc method
     * @name spaceContext#entryTitle
     * @param {Client.Entry} entry
     * @param {string} localeCode
     * @param {Object} modelValue
     * @return {Object}
     * @description
     * Returns the title for a given entry and locale.
     * The `modelValue` flag, if true, causes `null` to be returned
     * when no title is present. If false or left unspecified, the
     * UI string indicating that is returned, which is 'Untitled'.
     */
    entryTitle: function(entry, localeCode, modelValue) {
      var defaultTitle = Boolean(modelValue) ? null : 'Untitled';

      try {
        var displayField = this.publishedTypeForEntry(entry).data.displayField;
        if (!displayField) {
          return defaultTitle;
        } else {
          var title = this.localizedField(entry, 'data.fields.'+displayField, localeCode);
          if (!title || title.match(/^\s*$/)) {
            return defaultTitle;
          } else {
            return title;
          }
        }
      } catch (e) {
        return defaultTitle;
      }
    },

    /**
     * @ngdoc method
     * @name spaceContext#assetTitle
     * @param {Client.Asset} asset
     * @param {string} localeCode
     * @return {Object}
     * @description
     * Returns the title for a given asset and locale.
     */
    assetTitle: function (asset, localeCode) {
      var defaultTitle = 'Untitled';

      try {
        var title = this.localizedField(asset, 'data.fields.title', localeCode);
        if (!title || title.match(/^\s*$/)) {
          return defaultTitle;
        } else {
          return title;
        }
      } catch(e) {
        return defaultTitle;
      }
    }
  };

  function refreshPublishedContentTypes() {
    return spaceContext.space.getPublishedContentTypes()
    .then(function (contentTypes) {
      contentTypes = _.union(contentTypes, spaceContext.publishedContentTypes);
      contentTypes = filterAndSortContentTypes(contentTypes);
      spaceContext.publishedContentTypes = contentTypes;

      spaceContext._publishedContentTypesHash = _.transform(contentTypes, function(acc, ct) {
        var id = ct.getId();
        acc[id] = ct;
        spaceContext._publishedContentTypeIsMissing[id] = false;
      });

      return contentTypes;
    }, function (err) {
      var message = dotty.get(err, 'body.message');
      if(message) {
        notification.warn(message);
      } else {
        notification.warn('Could not get published Content Types');
        logger.logServerError('Could not get published Content Types', { error: err });
      }
      return $q.reject(err);
    });
  }

  function filterAndSortContentTypes(contentTypes) {
    contentTypes = _.reject(contentTypes, function (ct) { return ct.isDeleted(); });
    contentTypes.sort(function (a,b) {
      return a.getName().localeCompare(b.getName());
    });
    return contentTypes;
  }

  spaceContext.resetWithSpace(null);
  return spaceContext;

}]);
