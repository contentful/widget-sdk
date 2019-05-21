import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import { deepFreeze, deepFreezeClone } from 'utils/Freeze.es6';
import * as ShareJSConnection from 'data/sharejs/Connection.es6';
import createApiKeyRepo from 'data/CMA/ApiKeyRepo.es6';
import shouldUseEnvEndpoint from 'data/shouldUseEnvEndpoint.es6';
import APIClient from 'data/APIClient.es6';
import previewEnvironmentsCache from 'data/previewEnvironmentsCache.es6';
import * as logger from 'services/logger.es6';
import * as Telemetry from 'i13n/Telemetry.es6';
import createUserCache from 'data/userCache.es6';
import * as EntityFieldValueHelpers from './EntityFieldValueHelpers.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name spaceContext
   *
   * @description
   * This service holds all context related to a space, including
   * contentTypes, users, and helper methods.
   */
  registerFactory('spaceContext', [
    '$q',
    '$rootScope',
    '$injector',
    'client',
    'TheLocaleStore',
    'Config.es6',
    'Authentication.es6',
    'services/TokenStore.es6',
    'services/EnforcementsService.es6',
    'data/sharejs/DocumentPool.es6',
    'access_control/AccessChecker/index.es6',
    'access_control/SpaceMembershipRepository.es6',
    'data/ContentTypeRepo/Published.es6',
    'data/Endpoint.es6',
    'data/UiConfig/Store.es6',
    'data/CMA/LocaleRepo.es6',
    'data/CMA/SpaceEnvironmentsRepo.es6',
    'data/CMA/WebhookRepo.es6',
    'app/settings/apps/CachedAppConfig.es6',
    'saved-views-migrator',
    (
      $q,
      $rootScope,
      $injector,
      client,
      TheLocaleStore,
      Config,
      Auth,
      TokenStore,
      EnforcementsService,
      DocumentPool,
      accessChecker,
      MembershipRepo,
      PublishedCTRepo,
      { createSpaceEndpoint },
      { default: createUiConfigStore },
      { default: createLocaleRepo },
      { create: createEnvironmentsRepo },
      { default: createWebhookRepo },
      { default: createCachedAppConfig },
      { create: createViewMigrator }
    ) => {
      const publishedCTsBus$ = K.createPropertyBus([]);

      // Enforcements deinitialization function, when changing space
      let enforcementsDeInit;

      const spaceContext = {
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
        purge: function() {
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
        resetWithSpace: function(spaceData, environmentId) {
          const self = this;
          accessChecker.setSpace(spaceData);

          // `space` is @contentful/client.Space instance!
          let space = client.newSpace(spaceData);

          if (environmentId) {
            space = space.makeEnvironment(environmentId, shouldUseEnvEndpoint);
          }

          self.endpoint = createSpaceEndpoint(Config.apiUrl(), space.getId(), Auth, environmentId);

          resetMembers(self);
          self.space = space;
          self.cma = new APIClient(self.endpoint);
          self.users = createUserCache(self.endpoint);
          self.apiKeyRepo = createApiKeyRepo(self.endpoint);
          self.webhookRepo = createWebhookRepo(space);
          self.localeRepo = createLocaleRepo(self.endpoint);
          self.organization = deepFreezeClone(self.getData('organization'));

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
          const publishedCTsForSpace = PublishedCTRepo.create(space);
          K.onValue(publishedCTsForSpace.items$, items => {
            publishedCTsBus$.set(items);
          });
          _.assign(self.publishedCTs, _.omit(publishedCTsForSpace, 'items$'));

          self.user = K.getValue(TokenStore.user$);

          previewEnvironmentsCache.clearAll();
          self.netlifyAppConfig = createCachedAppConfig({
            spaceId: space.getId(),
            appId: 'netlify',
            makeDefaultConfig: () => ({ sites: [] })
          });

          // This happens here, rather than in `prelude.js`, since it's scoped to a space
          // and not the user, so the spaceId is required.
          enforcementsDeInit = EnforcementsService.init(space.getId());

          // TODO: remove this after we have store with combined reducers on top level
          // string is hardcoded because this code _is_ temporary
          $rootScope.$broadcast('spaceContextUpdated');

          const start = Date.now();

          return $q
            .all([
              maybeFetchEnvironments(self.endpoint).then(environments => {
                self.environments = deepFreeze(environments);
              }),
              TheLocaleStore.init(self.localeRepo),
              self.publishedCTs.refresh().then(() => {
                const ctMap = self.publishedCTs.getAllBare().reduce((acc, ct) => {
                  return { ...acc, [ct.sys.id]: ct };
                }, {});

                self.uiConfig = createUiConfigStore(
                  space,
                  self.endpoint,
                  self.publishedCTs,
                  createViewMigrator(ctMap)
                );
              })
            ])
            .then(() => {
              Telemetry.record('space_context_http_time', Date.now() - start);

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
        getId: function() {
          return this.space && this.space.getId();
        },

        /**
         * @name spaceContext#getEnvironmentId
         * @description
         * Returns the current environment ID, defaulting to `master`.
         * Returns `undefined` if no space is set.
         * @returns string
         */
        getEnvironmentId: function() {
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
        getData: function(path, defaultValue) {
          const data = _.get(this, 'space.data', {});
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
        displayFieldForType: function(contentTypeId) {
          const ct = this.publishedCTs.get(contentTypeId);
          return ct && _.find(ct.data.fields, { id: ct.data.displayField });
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
         * @param {string?} internalLocaleCode
         * @return {any}
         */
        getFieldValue: function(entity, internalFieldId, internalLocaleCode) {
          const defaultInternalLocaleCode = getDefaultInternalLocaleCode();

          return EntityFieldValueHelpers.getFieldValue({
            entity: _.get(entity, 'data'),
            internalFieldId,
            internalLocaleCode,
            defaultInternalLocaleCode
          });
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
        entryTitle: function(entry, localeCode, modelValue) {
          const defaultTitle = modelValue ? null : 'Untitled';
          let title = defaultTitle;
          try {
            const contentTypeId = entry.getContentTypeId();
            const contentType = this.publishedCTs.get(contentTypeId);
            const defaultInternalLocaleCode = getDefaultInternalLocaleCode();

            title = EntityFieldValueHelpers.getEntryTitle({
              entry: entry.data,
              contentType: contentType.data,
              internalLocaleCode: localeCode,
              defaultInternalLocaleCode,
              defaultTitle
            });
          } catch (error) {
            // TODO: Don't use try catch. Instead, handle undefined/unexpected values.
            logger.logWarn('Failed to determine entry title', {
              error: error,
              entrySys: _.get(entry, 'data.sys')
            });
          }

          return title;
        },

        /**
         * @ngdoc method
         * @name spaceContext#entityDescription
         * @param {Client.Entity} entity
         * @param {string?} localeCode
         * @description
         * Gets the localized value of the first text field that is not the
         * display field and assumably not a slug field. Returns undefined if
         * there is no such field.
         *
         * @return {string?}
         */
        entityDescription: function(entity, localeCode) {
          const contentTypeId = entity.getContentTypeId();
          const contentType = this.publishedCTs.get(contentTypeId);
          if (!contentType) {
            return undefined;
          }
          const isTextField = field => ['Symbol', 'Text'].includes(field.type);
          const isDisplayField = field => field.id === contentType.data.displayField;
          const isMaybeSlugField = field => /\bslug\b/.test(field.name);
          const isDescriptionField = field =>
            isTextField(field) && !isDisplayField(field) && !isMaybeSlugField(field);

          const descriptionField = contentType.data.fields.find(isDescriptionField);
          return descriptionField
            ? this.getFieldValue(entity, descriptionField.id, localeCode)
            : undefined;
        },

        /**
         * @ngdoc method
         * @name spaceContext#entryImage
         * @param {Client.Entry} entry
         * @param {string?} localeCode
         * @return {Promise<Object|null>}
         * @description
         * Gets a promise resolving with a localized asset image field representing a
         * given entities file. The promise may resolve with null.
         */
        entryImage: function(entry, localeCode) {
          const link = getValueForMatchedField(this, entry, localeCode, {
            type: 'Link',
            linkType: 'Asset'
          });

          const assetId = _.get(link, 'sys.id');
          if (link && assetId) {
            return this.space.getAsset(assetId).then(
              asset => {
                const file = this.getFieldValue(asset, 'file', localeCode);
                const isImage = _.get(file, 'details.image');
                return isImage ? file : null;
              },
              () => null
            );
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
        assetTitle: function(asset, localeCode, modelValue) {
          const defaultTitle = modelValue ? null : 'Untitled';

          let title = defaultTitle;
          try {
            const defaultInternalLocaleCode = getDefaultInternalLocaleCode();

            title = EntityFieldValueHelpers.getAssetTitle({
              asset: asset.data,
              defaultTitle,
              internalLocaleCode: localeCode,
              defaultInternalLocaleCode
            });
          } catch (error) {
            // TODO: Don't use try catch. Instead, handle undefined/unexpected values.
            logger.logWarn('Failed to determine asset title', {
              error: error,
              assetSys: _.get(asset, 'data.sys')
            });
          }

          return title;
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
        entityTitle: function(entity, localeCode) {
          const type = entity.getType();

          if (type === 'Entry') {
            return this.entryTitle(entity, localeCode, true);
          } else if (type === 'Asset') {
            return this.assetTitle(entity, localeCode, true);
          } else {
            return null;
          }
        }
      };

      resetMembers(spaceContext);
      return spaceContext;

      function resetMembers(spaceContext) {
        // Deinit the enforcement refreshing on space ID change, so that
        // the previous space ID enforcement information isn't queried
        if (enforcementsDeInit) {
          enforcementsDeInit();
        }

        spaceContext.uiConfig = null;
        spaceContext.space = null;
        spaceContext.users = null;
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
      function getValueForMatchedField(spaceContext, entity, localeCode, fieldDefinition) {
        const contentTypeId = entity.getContentTypeId();
        const contentType = spaceContext.publishedCTs.get(contentTypeId);
        if (!contentType) {
          return;
        }
        const field = _.find(contentType.data.fields, fieldDefinition);
        if (field) {
          return spaceContext.getFieldValue(entity, field.id, localeCode);
        }
      }

      function maybeFetchEnvironments(spaceEndpoint) {
        // FIXME This prevents a circular dependency
        const LD = $injector.get('utils/LaunchDarkly');
        return LD.getCurrentVariation('feature-dv-11-2017-environments').then(
          environmentsEnabled => {
            if (environmentsEnabled) {
              return createEnvironmentsRepo(spaceEndpoint).getAll();
            }
          }
        );
      }

      /**
       * Returns an internal code of a default locale.
       *
       * @returns {String?}
       */
      function getDefaultInternalLocaleCode() {
        const defaultLocale = TheLocaleStore.getDefaultLocale();

        return _.get(defaultLocale, 'internal_code');
      }
    }
  ]);
}
