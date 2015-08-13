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
  var PromisedLoader     = $injector.get('PromisedLoader');
  var ReloadNotification = $injector.get('ReloadNotification');
  var notification       = $injector.get('notification');
  var logger             = $injector.get('logger');

  function SpaceContext () {
    this.resetWithSpace(null);
  }

  SpaceContext.prototype = {
      /**
       * @ngdoc method
       * @name spaceContext#resetWithSpace
       * @param {Object} space
       * @description
       * This method resets a space context with a given space, as well as
       * associated locales information
      */
      resetWithSpace: function(space){
        this.space = space;
        this.contentTypes = [];
        this._contentTypeLoader = new PromisedLoader();

        this.publishedContentTypes = [];
        this._publishedContentTypesHash = {};
        this._publishedContentTypeIsMissing = {};
        this._publishedContentTypeLoader = new PromisedLoader();
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
        if (this.space) {
          var spaceContext = this;
          return this._contentTypeLoader.loadPromise(function(){
            return spaceContext.space.getContentTypes({order: 'name', limit: 1000});
          })
          .then(function (contentTypes) {
            spaceContext.contentTypes = filterAndSortContentTypes(contentTypes);
            return spaceContext.refreshPublishedContentTypes().then(function () {
              return contentTypes;
            });
          })
          .catch(ReloadNotification.apiErrorHandler);
        } else {
          this.contentTypes = [];
          this.publishedContentTypes = [];
          this._publishedContentTypesHash = {};
          return $q.when(this.contentTypes);
        }
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
       * @name spaceContext#refreshPublishedContentTypes
       * @description
       * Refreshes list of published content types
       */
      // FIXME Much like `refreshContentTypes()` this is a potential
      // source of a race condition.
      refreshPublishedContentTypes: function() {
        var spaceContext = this;
        return this._publishedContentTypeLoader.loadPromise(function(){
          return spaceContext.space.getPublishedContentTypes();
        })
        .then(function (contentTypes) {
          // TODO use filterAndSortContentTypes here
          spaceContext.publishedContentTypes = _(contentTypes)
            .reject(function (ct) { return ct.isDeleted(); })
            .union(spaceContext.publishedContentTypes)
            .sortBy(function(ct) { return ct.getName().trim().toLowerCase(); })
            .value();

          // TODO we could probably reduce here
          spaceContext._publishedContentTypesHash = _(spaceContext.publishedContentTypes).map(function(ct) {
            return [ct.getId(), ct];
          }).object().valueOf();

          _.each(spaceContext._publishedContentTypesHash, function (val, id) {
            spaceContext._publishedContentTypeIsMissing[id] = false;
          });

          return spaceContext.publishedContentTypes;
        }, function (err) {
          if (err === PromisedLoader.IN_PROGRESS) return;
          var message = dotty.get(err, 'body.message');
          if(message) {
            notification.warn(message);
          } else {
            notification.warn('Could not get published Content Types');
            logger.logServerError('Could not get published Content Types', { error: err });
          }
          return $q.reject(err);
        })
        .catch(ReloadNotification.apiErrorHandler);
      },

      /**
       * @ngdoc method
       * @name spaceContext#registerPublishedContentType
       * @param {Object} contentType
      */
      registerPublishedContentType: function (contentType) {
        // TODO this check should look at the hash instead
        if (!_.contains(this.publishedContentTypes, contentType)) {
          this.publishedContentTypes.push(contentType);
          this._publishedContentTypesHash[contentType.getId()] = contentType;
          $rootScope.$broadcast('contentTypePublished', contentType);
        }
      },

      /**
       * @ngdoc method
       * @name spaceContext#unregisterPublishedContentType
       * @param {Object} publishedContentType
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
       * @param {Object} contentType
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
       * @param {Object} entry
       * @return {Object}
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
       * @return {Object}
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
       * @param {Object} locale
       * @return {Object}
       * @description
       * Given an entity (entry/asset), and a field path, returns the field
       * content for a given locale
      */
      localizedField: function(entity, path, locale) {
        var getField = $parse(path);
        var field = getField(entity);
        var defaultLocale = this.space.getDefaultLocale().internal_code;
        locale = locale || defaultLocale;
        return (field && field[locale]) || field && field[defaultLocale];
      },

      /**
       * @ngdoc method
       * @name spaceContext#entryTitle
       * @param {Object} entry
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
       * @param {Object} asset
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

    function filterAndSortContentTypes(contentTypes) {
      contentTypes = _.reject(contentTypes, function (ct) { return ct.isDeleted(); });
      contentTypes.sort(function (a,b) {
        return a.getName().localeCompare(b.getName());
      });
      return contentTypes;
    }

    return new SpaceContext();
}]);
