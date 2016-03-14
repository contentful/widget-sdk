'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name spaceContext
 *
 * @description
 * This service holds all context related to a space, including
 * contentTypes, users, widgets, and helper methods.
 *
 * @property {Client.ContentType[]} contentTypes
 * @property {Client.ContentType[]} publishedContentTypes
 * @property {Client.Space} space
 */
.factory('spaceContext', ['$injector', function($injector){
  var $parse             = $injector.get('$parse');
  var $q                 = $injector.get('$q');
  var $timeout           = $injector.get('$timeout');
  var ReloadNotification = $injector.get('ReloadNotification');
  var notification       = $injector.get('notification');
  var logger             = $injector.get('logger');
  var TheLocaleStore     = $injector.get('TheLocaleStore');
  var createUserCache    = $injector.get('data/userCache');
  var ctHelpers          = $injector.get('data/ContentTypes');
  var Widgets            = $injector.get('widgets');
  var spaceEndpoint      = $injector.get('data/spaceEndpoint');
  var authentication     = $injector.get('authentication');
  var environment        = $injector.get('environment');
  var createEIRepo       = $injector.get('data/editingInterfaces');
  var createQueue        = $injector.get('overridingRequestQueue');

  var requestContentTypes = createQueue(fetchContentTypes);

  var spaceContext = {
    /**
     * @ngdoc method
     * @name spaceContext#purge
     * @description
     * This method purges a space context, so it doesn't contain space any longer
     */
    purge: function () {
      resetMembers(spaceContext);
    },
    /**
     * @ngdoc method
     * @name spaceContext#resetWithSpace
     * @param {Client.Space} space
     * @description
     * This method resets a space context with a given space
     *
     * It also sets the space on the [Widgets][] and [TheLocaleStore][]
     * services to
     *
     * [Widgets]: api/contentful/app/service/widgets
     * [TheLocaleStore]: api/contentful/app/service/TheLocaleStore
     *
     * @param {Client.Space} space
     * @returns {Client.Space}
     */
    resetWithSpace: function (space){
      var self = this;
      var endpoint = spaceEndpoint.create(
        authentication.token,
        '//' + environment.settings.api_host,
        space.getId()
      );

      resetMembers(self);
      self.space = space;
      self.users = createUserCache(space);
      self.editingInterfaces = createEIRepo(endpoint);
      TheLocaleStore.resetWithSpace(space);
      return Widgets.setSpace(space).then(function (widgets) {
        self.widgets = widgets;
        return self;
      });
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
    refreshContentTypes: function() {
      if (!this.space) {
        this.contentTypes = [];
        this.publishedContentTypes = [];
        this._publishedContentTypesHash = {};
        return $q.resolve(this.contentTypes);
      }

      return requestContentTypes();
    },

    /**
     * @ngdoc method
     * @name spaceContext#refreshContentTypesUntilChanged
     * @description
     * Refreshes all Content Type related information in the context.
     * If refresh doesn't change state of content types, it tries
     * again (with limit of 5 tries and 1500ms of delay between requests).
     * It's needed because if the content type was created for the first
     * time the API will not include it immediately.
     */
    refreshContentTypesUntilChanged: function () {
      if (!_.isNumber(this.refreshTriesLeft)) {
        this.refreshTriesLeft = 5;
      } else if (this.refreshTriesLeft > 1) {
        this.refreshTriesLeft -= 1;
      } else {
        this.refreshTriesLeft = null;
        return $q.when(this.publishedContentTypes);
      }

      return requestContentTypes(function () {
        var idsBefore = getContentTypeIds();
        var d = $q.defer();

        fetchContentTypes().then(function (result) {
          if (idsBefore !== getContentTypeIds()) {
            d.resolve(result);
            return;
          }

          $timeout(function () {
            spaceContext.refreshContentTypesUntilChanged();
            d.resolve(result);
          }, 1500);
        });

        return d.promise;
      });
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
      if (contentType) { return $q.resolve(contentType); }

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
     * @name spaceContext#entityDescription
     * @param {Client.Entity} entry
     * @description
     * Gets the localized value of the first text field that is not the
     * display field. May return undefined.
     *
     * @return {string?}
     */
    entityDescription: function (entity) {
      var contentType = this.publishedTypeForEntry(entity);
      if (!contentType) {
        return;
      }

      var field = _.find(contentType.data.fields, function (field){
        return field.id !== contentType.data.displayField && field.type == 'Text';
      });

      if (field) {
        return this.localizedField(entity, 'data.fields.' + field.id);
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

  resetMembers(spaceContext);
  return spaceContext;

  function fetchContentTypes() {
    return spaceContext.space.getContentTypes({order: 'name', limit: 1000})
    .then(refreshContentTypes)
    .catch(ReloadNotification.apiErrorHandler);
  }

  function getContentTypeIds() {
    return  _(spaceContext.contentTypes).map(function (ct) {
      return ct.getId();
    }).sortBy().join(',');
  }

  function refreshContentTypes(contentTypes) {
    spaceContext.contentTypes = filterAndSortContentTypes(contentTypes);

    // Some legacy content types do not have a name. If it is
    // missing we set it to 'Untitled' so we can display
    // something in the UI. Note that the API requires new
    // Content Types to have a name.
    _.forEach(spaceContext.contentTypes, function (ct) {
      ctHelpers.assureName(ct.data);
    });

    return refreshPublishedContentTypes();
  }

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

  function resetMembers (spaceContext) {
    spaceContext.space = null;
    spaceContext.contentTypes = [];
    spaceContext.publishedContentTypes = [];
    spaceContext._publishedContentTypesHash = {};
    spaceContext._publishedContentTypeIsMissing = {};
    spaceContext.refreshContentTypes();
    spaceContext.users = null;
    spaceContext.widgets = null;
  }

}]);
