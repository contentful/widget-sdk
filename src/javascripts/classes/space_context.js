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
 * @property {Data.APIClient} cma
 */
.factory('spaceContext', ['$injector', function ($injector) {
  var $parse = $injector.get('$parse');
  var $q = $injector.get('$q');
  var $timeout = $injector.get('$timeout');
  var ReloadNotification = $injector.get('ReloadNotification');
  var notification = $injector.get('notification');
  var logger = $injector.get('logger');
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var createUserCache = $injector.get('data/userCache');
  var ctHelpers = $injector.get('data/ContentTypes');
  var Widgets = $injector.get('widgets');
  var spaceEndpoint = $injector.get('data/spaceEndpoint');
  var authentication = $injector.get('authentication');
  var environment = $injector.get('environment');
  var createEIRepo = $injector.get('data/editingInterfaces');
  var createQueue = $injector.get('overridingRequestQueue');
  var ApiClient = $injector.get('data/ApiClient');
  var ShareJSConnection = $injector.get('data/ShareJS/Connection');
  var Subscription = $injector.get('Subscription');
  var previewEnvironmentsCache = $injector.get('data/previewEnvironmentsCache');

  var requestContentTypes = createQueue(function (extraHandler) {
    return spaceContext.space.getContentTypes({order: 'name', limit: 1000})
    .then(refreshContentTypes, ReloadNotification.apiErrorHandler)
    .then(extraHandler || _.identity);
  });

  var waiter = {
    reset: function () {
      this.attempts = _.range(5);
      return this;
    },
    canWait: function () {
      return _.isNumber(this.attempts.pop());
    },
    waitAndRetry: function () {
      return $timeout(function () {
        spaceContext.refreshContentTypesUntilChanged();
      }, 1500);
    }
  }.reset();

  // Maps CT ID to instance of Client.ContentType
  var publishedContentTypesHash = {};

  var publishedContentTypeIsMissing = {};

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
     * It also sets the space on the [TheLocaleStore][]
     * service.
     *
     * The returned promise resolves when all the custom extension and
     * content types for this space have been fetched.
     *
     * [TheLocaleStore]: api/contentful/app/service/TheLocaleStore
     *
     * @param {Client.Space} space
     * @returns {Promise<self>}
     */
    resetWithSpace: function (space) {
      var self = this;
      var endpoint = spaceEndpoint.create(
        authentication.token,
        '//' + environment.settings.api_host,
        space.getId()
      );

      resetMembers(self);
      self.space = space;
      self.cma = new ApiClient(endpoint);
      self.users = createUserCache(space);
      self.editingInterfaces = createEIRepo(endpoint);
      var organization = self.getData('organization') || null;
      self.subscription =
        organization && Subscription.newFromOrganization(organization);

      self.docConnection = ShareJSConnection.create(
        authentication.token,
        environment.settings.ot_host,
        space.getId()
      );

      previewEnvironmentsCache.clearAll();
      TheLocaleStore.resetWithSpace(space);
      return $q.all([loadWidgets(self, space), requestContentTypes()])
      .then(function () {
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
    refreshContentTypes: function () {
      if (this.space) {
        return requestContentTypes();
      } else {
        throw new Error('Cannot refresh content types: no space in the context.');
      }
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
      var before = getContentTypeIds(spaceContext.contentTypes);
      return requestContentTypes.hasToFinish(retryIfNotChanged);

      function retryIfNotChanged (response) {
        var after = getContentTypeIds(spaceContext.contentTypes);
        if (after === before && waiter.canWait()) {
          return waiter.waitAndRetry();
        } else {
          waiter.reset();
          return response;
        }
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
     * @name spaceContext#registerPublishedContentType
     * @param {Client.ContentType} contentType
    */
    registerPublishedContentType: function (contentType) {
      if (!publishedContentTypesHash[contentType.getId()]) {
        this.publishedContentTypes.push(contentType);
        publishedContentTypesHash[contentType.getId()] = contentType;
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
      publishedContentTypesHash = _.omitBy(publishedContentTypesHash, function (ct) {
        return ct === publishedContentType;
      });
    },

    /**
     * @ngdoc method
     * @name spaceContext#removeContentType
     * @param {Client.ContentType} contentType
    */
    removeContentType: function (contentType) {
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
    publishedTypeForEntry: function (entry) {
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
      var contentType = publishedContentTypesHash[contentTypeId];

      if (!contentType && !publishedContentTypeIsMissing[contentTypeId]) {
        publishedContentTypeIsMissing[contentTypeId] = true;
        if (requestContentTypes.isIdle()) {
          this.refreshContentTypes();
        }
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
      var contentType = pick();
      if (contentType) { return $q.resolve(contentType); }

      return this.refreshContentTypes().then(pick);

      function pick () {
        return publishedContentTypesHash[contentTypeId];
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
     * @name spaceContext#localizedValue
     * @param {Object} field Object with locales as keys.
     * @param {string?} localeCode
     * @returns {Object?}
     * @description
     * Returns a localized value from a field. Optionally takes a localeCode and
     * falls back to the space's default locale or any other defined locale.
     */
    localizedValue: function (field, localeCode) {
      if (!field) {
        return;
      }
      var defaultLocale = this.space && this.space.getDefaultLocale();
      var defaultLocaleCode = defaultLocale && defaultLocale.internal_code;
      var firstLocaleCode = Object.keys(field)[0];

      localeCode = localeCode || defaultLocaleCode || firstLocaleCode;

      return field[localeCode] || field[defaultLocaleCode] || field[firstLocaleCode];
    },

    /**
     * @ngdoc method
     * @name spaceContext#localizedField
     * @param {Object} entity
     * @param {string|Array} path
     * @param {string} localeCode
     * @return {Object?}
     * @description
     * Given an entity (entry/asset), and a field path, returns the field
     * content for a given locale.
    */
    localizedField: function (entity, path, localeCode) {
      var getField = $parse(path);
      var field = getField(entity);

      return this.localizedValue(field, localeCode);
    },

    /**
     * @ngdoc method
     * @name spaceContext#findLocalizedField
     * @param {Object} entity
     * @param {string?} localeCode
     * @param {Object|function} fieldDefinition Part of a field definition, e.g.
     *        `{type: 'Link', linkType: 'Entry'}`.
     * @returns {Object?}
     * @description
     * Given an entity (entry/asset), and part of a field definition, returns
     * the field content for a given locale.
     */
    findLocalizedField: function (entity, localeCode, fieldDefinition) {
      fieldDefinition = fieldDefinition || localeCode;

      var contentType = this.publishedTypeForEntry(entity);
      if (!contentType) {
        return;
      }
      var field = _.find(contentType.data.fields, fieldDefinition);
      if (field) {
        var fieldPath = 'data.fields.' + field.id;
        return this.localizedField(entity, fieldPath, localeCode);
      }
    },

    /**
     * @ngdoc method
     * @name spaceContext#entryTitle
     * @param {Client.Entry} entry
     * @param {string} localeCode
     * @param {Object} modelValue
     * @return {string|null}
     * @deprecated Use entityTitle() instead.
     * @description
     * Returns the title for a given entry and locale.
     * The `modelValue` flag, if true, causes `null` to be returned
     * when no title is present. If false or left unspecified, the
     * UI string indicating that is returned, which is 'Untitled'.
     */
    entryTitle: function (entry, localeCode, modelValue) {
      var defaultTitle = modelValue ? null : 'Untitled';

      try {
        var displayField = this.publishedTypeForEntry(entry).data.displayField;
        if (!displayField) {
          return defaultTitle;
        } else {
          var title = this.localizedField(entry, 'data.fields.' + displayField, localeCode);
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
     * @param {string?} localeCode
     * @description
     * Gets the localized value of the first text field that is not the
     * display field. May return undefined.
     *
     * @return {string?}
     */
    entityDescription: function (entity, localeCode) {
      var contentType = this.publishedTypeForEntry(entity);
      if (!contentType) {
        return;
      }
      var displayFieldId = contentType.data.displayField;

      return this.findLocalizedField(entity, localeCode, function (field) {
        return _.includes(['Symbol', 'Text'], field.type) && field.id !== displayFieldId;
      });
    },

    /**
     * @ngdoc method
     * @name spaceContext#entryImage
     * @param {Client.Entry} entry
     * @param {string?} localeCode
     * @return {Promise<Object|null>}
     * @description
     * Gets a promise resolving with a localized asset image field representing a
     * given entities image. The promise may resolve with null.
     */
    entryImage: function (entry, localeCode) {
      var link = spaceContext.findLocalizedField(
        entry, localeCode, {type: 'Link', linkType: 'Asset'});

      var assetId = dotty.get(link, 'sys.id');
      if (link && assetId) {
        return this.space.getAsset(assetId).then(function (asset) {
          var fileField = dotty.get(asset, 'data.fields.file');
          var file = this.localizedValue(fileField, localeCode);
          var isImage = dotty.get(file, 'details.image');
          return isImage ? file : null;
        }.bind(this), function () {
          return null;
        });
      } else {
        return $q.resolve(null);
      }
    },

    /**
     * @ngdoc method
     * @name spaceContext#assetTitle
     * @param {Client.Asset} asset
     * @param {string} localeCode
     * @param {Object} modelValue
     * @return {Object}
     * @deprecated Use entityTitle() instead.
     * @description
     * Returns the title for a given asset and locale.
     * The `modelValue` flag, if true, causes `null` to be returned
     * when no title is present. If false or left unspecified, the
     * UI string indicating that is returned, which is 'Untitled'.
     */
    assetTitle: function (asset, localeCode, modelValue) {
      var defaultTitle = modelValue ? null : 'Untitled';

      try {
        var title = this.localizedField(asset, 'data.fields.title', localeCode);
        if (!title || title.match(/^\s*$/)) {
          return defaultTitle;
        } else {
          return title;
        }
      } catch (e) {
        return defaultTitle;
      }
    },

    /**
     * @ngdoc method
     * @name spaceContext#entityTitle
     * @param {Client.Entity} entity
     * @param {string} localeCode
     * @return {string|null}
     * @description
     * Returns the title for a given entity and locale. Returns null if
     * no title can be found for the entity.
     */
    entityTitle: function (entity, localeCode) {
      var type = entity.getType();
      if (!_.includes(['Entry', 'Asset'], type)) {
        return null;
      }
      var getterName = type.toLowerCase() + 'Title'; // entryTitle() or assetTitle()
      return this[getterName](entity, localeCode, true);
    }
  };

  resetMembers(spaceContext);
  return spaceContext;

  function getContentTypeIds (cts) {
    return _(cts).map(function (ct) {
      return ct.getId();
    }).sortBy().join(',');
  }

  function refreshContentTypes (contentTypes) {
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

  function refreshPublishedContentTypes () {
    return spaceContext.space.getPublishedContentTypes()
    .then(function (contentTypes) {
      contentTypes = _.union(contentTypes, spaceContext.publishedContentTypes);
      contentTypes = filterAndSortContentTypes(contentTypes);
      spaceContext.publishedContentTypes = contentTypes;

      publishedContentTypesHash = _.transform(contentTypes, function (acc, ct) {
        var id = ct.getId();
        acc[id] = ct;
        publishedContentTypeIsMissing[id] = false;
      });

      return contentTypes;
    }, function (err) {
      var message = dotty.get(err, 'body.message');
      if (message) {
        notification.warn(message);
      } else {
        notification.warn('Could not get published content types');
        logger.logServerError('Could not get published Content Types', { error: err });
      }
      return $q.reject(err);
    });
  }

  function filterAndSortContentTypes (contentTypes) {
    contentTypes = _.reject(contentTypes, function (ct) { return ct.isDeleted(); });
    contentTypes.sort(function (a, b) {
      return a.getName().localeCompare(b.getName());
    });
    return contentTypes;
  }

  function resetMembers (spaceContext) {
    spaceContext.space = null;
    spaceContext.contentTypes = [];
    spaceContext.publishedContentTypes = [];
    publishedContentTypesHash = {};
    publishedContentTypeIsMissing = {};
    spaceContext.users = null;
    spaceContext.widgets = null;
    if (spaceContext.docConnection) {
      spaceContext.docConnection.close();
      spaceContext.docConnection = null;
    }
  }

  function loadWidgets (spaceContext, space) {
    return Widgets.setSpace(space).then(function (widgets) {
      spaceContext.widgets = widgets;
    });
  }
}]);
