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
 * @property {Client.Space} space
 * @property {Data.APIClient} cma
 * @property {ACL.SpaceMembershipRepository} memberships
 */
.factory('spaceContext', ['require', function (require) {
  var $q = require('$q');
  var TheLocaleStore = require('TheLocaleStore');
  var createUserCache = require('data/userCache');
  var Widgets = require('widgets');
  var createSpaceEndpoint = require('data/Endpoint').createSpaceEndpoint;
  var Config = require('Config');
  var createEIRepo = require('data/editingInterfaces');
  var ApiClient = require('data/ApiClient');
  var ShareJSConnection = require('data/sharejs/Connection');
  var Subscription = require('Subscription');
  var previewEnvironmentsCache = require('data/previewEnvironmentsCache');
  var PublishedCTRepo = require('data/ContentTypeRepo/Published');
  var logger = require('logger');
  var DocumentPool = require('data/sharejs/DocumentPool');
  var TokenStore = require('services/TokenStore');
  var createApiKeyRepo = require('data/CMA/ApiKeyRepo').default;
  var K = require('utils/kefir');
  var Auth = require('Authentication');
  var OrganizationContext = require('classes/OrganizationContext');
  var MembershipRepo = require('access_control/SpaceMembershipRepository');
  var createUiConfigStore = require('data/UiConfig/Store').default;
  var createViewMigrator = require('data/ViewMigrator').default;
  var client = require('client');
  var createLocaleRepo = require('data/CMA/LocaleRepo').default;
  var accessChecker = require('access_control/AccessChecker');
  var shouldUseEnvEndpoint = require('data/shouldUseEnvEndpoint').default;

  var publishedCTsBus$ = K.createPropertyBus([]);

  var spaceContext = {
    /**
     * @description
     * A property containing data on the published CTs in the current space.
     * It is updated in resetWithSpace method once we know we are in the context
     * of a space.
     */
    publishedCTs: {
      items$: publishedCTsBus$.property
    },
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
     * @description
     * This method resets a space context with a given space.
     * It requires an API space object. Internally we create
     * @contentful/client instance.
     *
     * The returned promise resolves when all additional space
     * resources have been fetched:
     * - Extensions
     * - Content types
     * - UI Configs (space and user)
     * - Locales
     *
     * @param {API.Space} spaceData
     * @param {string?} environmentId if provided will create environment-aware spaceContext
     * @returns {Promise<self>}
     */
    resetWithSpace: function (spaceData, environmentId) {
      var self = this;
      accessChecker.setSpace(spaceData);

      // `space` is @contentful/client.Space instance!
      var space = client.newSpace(spaceData);
      if (environmentId) {
        space = space.makeEnvironment(environmentId, shouldUseEnvEndpoint);
      }

      self.endpoint = createSpaceEndpoint(
        Config.apiUrl(),
        space.getId(),
        Auth,
        environmentId
      );

      resetMembers(self);
      self.space = space;
      self.cma = new ApiClient(self.endpoint);
      self.users = createUserCache(self.endpoint);
      self.apiKeyRepo = createApiKeyRepo(self.endpoint);
      self.editingInterfaces = createEIRepo(self.endpoint);
      self.localeRepo = createLocaleRepo(self.endpoint);
      var organization = self.getData('organization') || null;
      self.organizationContext = OrganizationContext.create(organization);
      self.subscription = organization && Subscription.newFromOrganization(organization);

      // TODO: publicly accessible docConnection is
      // used only in a process of creating space out
      // of a template. We shouldn't use it in newly
      // created code.

      self.docConnection = ShareJSConnection.create(
        Config.otUrl,
        Auth,
        space.getId(),
        environmentId || 'master'
      );

      self.memberships = MembershipRepo.create(self.endpoint);

      self.docPool = DocumentPool.create(self.docConnection, self.endpoint);

      /**
       * ContentTypeRepo with all CTs on the space already fetched which allows safe
       * usage of `spaceContext.publishedCTs.get(...)` (instead of `.fetch(...)`).
       * @type {data/ContentTypeRepo/Published}
       */
      var publishedCTsForSpace = PublishedCTRepo.create(space);
      K.onValue(publishedCTsForSpace.items$, function (items) {
        publishedCTsBus$.set(items);
      });
      _.assign(self.publishedCTs, _.omit(publishedCTsForSpace, 'items$'));

      self.user = K.getValue(TokenStore.user$);

      previewEnvironmentsCache.clearAll();

      return $q.all([
        Widgets.setSpace(self.endpoint).then(function (widgets) {
          self.widgets = widgets;
        }),
        self.publishedCTs.refresh().then(function () {
          var viewMigrator = createViewMigrator(space, self.publishedCTs);
          return createUiConfigStore(
            space, self.endpoint, self.publishedCTs, viewMigrator
          )
          .then(function (api) {
            self.uiConfig = api;
          });
        }),
        TheLocaleStore.init(self.localeRepo)
      ]).then(function () {
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
     * @name spaceContext#getEnvironmentId
     * @description
     * Returns the current environment ID, defaulting to `master`.
     * Returns `undefined` if no space is set.
     * @returns string
     */
    getEnvironmentId: function () {
      if (this.space) {
        return _.get(this, ['space', 'environment', 'sys', 'id'], 'master');
      }
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
      var data = _.get(this, 'space.data', {});
      return _.get(data, path, defaultValue);
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
      var ct = this.publishedCTs.get(contentTypeId);
      return ct && _.find(ct.data.fields, {id: ct.data.displayField});
    },

    /**
     * @ngdoc method
     * @name spaceContext#getFieldValue
     * @description
     * Given an entity (entry/asset) instance from the client libary,
     * and an internal field ID, returns the field’s value for the
     * given locale.
     *
     * If there is no value set for the given locale, the default
     * locale is used. If the locale code is omitted the default locale
     * is used, too.
     *
     * If there is no value set for the given local _and_ the default
     * locale the first value in the field object is used.
     *
     * @param {Client.Entity} entity
     * @param {string} internalFieldId
     * @param {string?} localeCode
     * @return {any}
     */
    getFieldValue: function (entity, fieldId, localeCode) {
      var values = _.get(entity, ['data', 'fields', fieldId]);
      if (!_.isObject(values)) {
        return;
      }

      var defaultLocale = TheLocaleStore.getDefaultLocale();
      var defaultLocaleCode = defaultLocale && defaultLocale.internal_code;
      var firstLocaleCode = Object.keys(values)[0];

      localeCode = localeCode || defaultLocaleCode || firstLocaleCode;

      return values[localeCode] || values[defaultLocaleCode] || values[firstLocaleCode];
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
      var title, displayField;

      try {
        var contentTypeId = entry.getContentTypeId();
        var contentType = this.publishedCTs.get(contentTypeId);
        if (!contentType) {
          return defaultTitle;
        }
        displayField = contentType.data.displayField;
        if (!displayField) {
          return defaultTitle;
        } else {
          title = this.getFieldValue(entry, displayField, localeCode);
          // TODO: Display meaningful title in case of non-string displayField.
          if (!title || title.match(/^\s*$/)) {
            return defaultTitle;
          } else {
            return title;
          }
        }
      } catch (error) {
        // TODO: Don't use try catch. Instead, handle undefined/unexpected values.
        logger.logWarn('Failed to determine entry title', {
          error: error,
          entrySys: _.get(entry, 'data.sys'),
          entryTitle: title,
          ctDisplayField: displayField
        });
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
      var contentTypeId = entity.getContentTypeId();
      var contentType = this.publishedCTs.get(contentTypeId);
      if (!contentType) {
        return;
      }
      var displayFieldId = contentType.data.displayField;
      var field = _.find(contentType.data.fields, function (field) {
        return _.includes(['Symbol', 'Text'], field.type) && field.id !== displayFieldId;
      });
      if (!field) {
        return;
      }

      return this.getFieldValue(entity, field.id, localeCode);
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
      var link = getValueForMatchedField(this, entry, localeCode, {type: 'Link', linkType: 'Asset'});

      var assetId = _.get(link, 'sys.id');
      if (link && assetId) {
        return this.space.getAsset(assetId).then(function (asset) {
          var file = this.getFieldValue(asset, 'file', localeCode);
          var isImage = _.get(file, 'details.image');
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
      var title;

      try {
        title = this.getFieldValue(asset, 'title', localeCode);
        if (!title || title.match(/^\s*$/)) {
          return defaultTitle;
        } else {
          return title;
        }
      } catch (error) {
        // TODO: Don't use try catch. Instead, handle undefined/unexpected values.
        logger.logWarn('Failed to determine asset title', {
          error: error,
          assetSys: _.get(asset, 'data.sys'),
          assetTitle: title
        });
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

  function resetMembers (spaceContext) {
    spaceContext.uiConfig = null;
    spaceContext.space = null;
    spaceContext.users = null;
    spaceContext.widgets = null;
    if (spaceContext.docPool) {
      spaceContext.docPool.destroy();
      spaceContext.docPool = null;
    }
    if (spaceContext.docConnection) {
      spaceContext.docConnection.close();
      spaceContext.docConnection = null;
    }
    if (self.publishedCTs) {
      self.publishedCTs = null;
    }
  }

  /**
   * @description
   * Return the value of the first field that matches the field
   * definition.
   *
   * The field ID is obtained from the entity’s content type and the
   * field value for the given locale is obtained using
   * `getFieldValue()`.
   *
   * @param {SpaceContext} spaceContext
   * @param {Client.Entity} entity
   * @param {string?} localeCode  Uses default locale if falsy
   * @param {Object|function} fieldMatcher
   *   Field matcher that is passed to '_.find'
   * @returns {any}
   */
  function getValueForMatchedField (spaceContext, entity, localeCode, fieldDefinition) {
    var contentTypeId = entity.getContentTypeId();
    var contentType = spaceContext.publishedCTs.get(contentTypeId);
    if (!contentType) {
      return;
    }
    var field = _.find(contentType.data.fields, fieldDefinition);
    if (field) {
      return spaceContext.getFieldValue(entity, field.id, localeCode);
    }
  }
}]);
