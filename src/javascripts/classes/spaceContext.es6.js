import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { create as createViewMigrator } from 'saved-views-migrator';
import * as K from 'utils/kefir.es6';
import { deepFreeze, deepFreezeClone } from 'utils/Freeze.es6';
import { ENVIRONMENT_ALIASING } from '../featureFlags.es6';
import client from 'services/client.es6';
import { purgeContentPreviewCache } from 'services/contentPreview';
import { purgeApiKeyRepoCache } from 'app/settings/api/services/ApiKeyRepoInstance';
const MASTER_ENVIRONMENT_ID = 'master';

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
    '$rootScope',
    $rootScope => {
      const publishedCTsBus$ = K.createPropertyBus([]);

      // Enforcements deinitialization function, when changing space
      let enforcementsDeInit;

      let ShareJSConnection;
      let shouldUseEnvEndpoint;
      let APIClient;
      let logger;
      let Telemetry;
      let createUserCache;
      let EntityFieldValueHelpers;
      let TheLocaleStore;
      let createExtensionDefinitionLoader;
      let createExtensionLoader;
      let createSpaceMembersRepo;
      let createEnvironmentsRepo;
      let createAliasesRepo;
      let createLocaleRepo;
      let createUiConfigStore;
      let createSpaceEndpoint;
      let createOrganizationEndpoint;
      let createExtensionDefinitionsEndpoint;
      let PublishedCTRepo;
      let MembershipRepo;
      let accessChecker;
      let DocumentPool;
      let EnforcementsService;
      let TokenStore;
      let Auth;
      let Config;
      let getSpaceFeature;

      const spaceContext = {
        async init() {
          [
            ShareJSConnection,
            { default: shouldUseEnvEndpoint },
            { default: APIClient },
            logger,
            Telemetry,
            { default: createUserCache },
            EntityFieldValueHelpers,
            { default: TheLocaleStore },
            { default: createExtensionDefinitionLoader },

            { createExtensionLoader },
            { default: createSpaceMembersRepo },
            { create: createEnvironmentsRepo },
            { create: createAliasesRepo },
            { default: createLocaleRepo },
            { default: createUiConfigStore },
            { createSpaceEndpoint, createOrganizationEndpoint, createExtensionDefinitionsEndpoint },
            PublishedCTRepo,
            MembershipRepo,
            accessChecker,
            DocumentPool,
            EnforcementsService,
            TokenStore,
            Auth,
            Config,
            { getSpaceFeature }
          ] = await Promise.all([
            import('data/sharejs/Connection.es6'),
            import('data/shouldUseEnvEndpoint.es6'),
            import('data/APIClient.es6'),
            import('services/logger.es6'),
            import('i13n/Telemetry.es6'),
            import('data/userCache.es6'),
            import('./EntityFieldValueHelpers.es6'),
            import('services/localeStore.es6'),
            import('app/settings/AppsBeta/ExtensionDefinitionLoader.es6'),
            import('widgets/ExtensionLoader.es6'),
            import('data/CMA/SpaceMembersRepo.es6'),
            import('data/CMA/SpaceEnvironmentsRepo.es6'),
            import('data/CMA/SpaceAliasesRepo.es6'),
            import('data/CMA/LocaleRepo.es6'),
            import('data/UiConfig/Store.es6'),
            import('data/Endpoint.es6'),
            import('data/ContentTypeRepo/Published.es6'),
            import('access_control/SpaceMembershipRepository.es6'),
            import('access_control/AccessChecker/index.es6'),
            import('data/sharejs/DocumentPool.es6'),
            import('services/EnforcementsService.es6'),
            import('services/TokenStore.es6'),
            import('Authentication.es6'),
            import('Config.es6'),
            import('data/CMA/ProductCatalog.es6')
          ]);
        },

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
         * @param {string?} uriEnvOrAliasId environment id based on the uri
         * @returns {Promise<self>}
         */
        resetWithSpace: function(spaceData, uriEnvOrAliasId) {
          const self = this;
          accessChecker.setSpace(spaceData);

          // `space` is @contentful/client.Space instance!
          let space = client.newSpace(spaceData);

          if (uriEnvOrAliasId) {
            // creates env aware routes on space
            space = space.makeEnvironment(uriEnvOrAliasId, shouldUseEnvEndpoint);
          }

          const spaceId = space.getId();

          self.endpoint = createSpaceEndpoint(Config.apiUrl(), spaceId, Auth, uriEnvOrAliasId);

          resetMembers(self);
          self.space = space;
          self.cma = new APIClient(self.endpoint);
          self.users = createUserCache(self.endpoint);
          self.localeRepo = createLocaleRepo(self.endpoint);
          self.organization = deepFreezeClone(self.getData('organization'));

          const extensionDefinitionsEndpoint = createExtensionDefinitionsEndpoint(
            Config.apiUrl(),
            Auth
          );

          const orgEndpoint = createOrganizationEndpoint(
            Config.apiUrl(),
            self.organization.sys.id,
            Auth
          );

          self.extensionDefinitionLoader = createExtensionDefinitionLoader(
            extensionDefinitionsEndpoint,
            orgEndpoint
          );

          self.extensionLoader = createExtensionLoader(
            self.extensionDefinitionLoader,
            self.endpoint
          );

          // TODO: publicly accessible docConnection is
          // used only in a process of creating space out
          // of a template. We shouldn't use it in newly
          // created code.

          self.docConnection = ShareJSConnection.create(
            Config.otUrl,
            Auth,
            spaceId,
            uriEnvOrAliasId || MASTER_ENVIRONMENT_ID
          );

          self.memberships = MembershipRepo.create(self.endpoint);
          self.members = createSpaceMembersRepo(self.endpoint);

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

          // This happens here, rather than in `prelude.js`, since it's scoped to a space
          // and not the user, so the spaceId is required.
          enforcementsDeInit = EnforcementsService.init(spaceId);

          const start = Date.now();
          return Promise.all([
            setupEnvironments(self, uriEnvOrAliasId),
            setupAliases(self),
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
          ]).then(() => {
            Telemetry.record('space_context_http_time', Date.now() - start);
            // TODO: remove this after we have store with combined reducers on top level
            // string is hardcoded because this code _is_ temporary
            $rootScope.$broadcast('spaceContextUpdated');
            return self;
          });
        },

        /**
         * @description
         * Returns ID of current space, if set
         * @returns String
         */
        getId: function() {
          return this.space && this.space.getId();
        },

        /**
         * @description
         * Returns current space, if set
         * @returns Object
         */
        getSpace: function() {
          return this.space;
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
            return _.get(this, ['space', 'environment', 'sys', 'id'], MASTER_ENVIRONMENT_ID);
          }
        },

        /**
         * @name spaceContext#isMasterEnvironment
         * @param {envOrAlias} Environment or Alias
         * @description
         * Returns whether the current environment is aliased to 'master'
         * or is 'master'
         * Returns true for an environment object with a re-written sys.id of
         * 'master' (aka the environment as accessed via it's alias)
         * @returns boolean
         */
        isMasterEnvironment: function(
          envOrAlias = _.get(this, ['space', 'environment'], { sys: { id: MASTER_ENVIRONMENT_ID } })
        ) {
          if (
            envOrAlias.sys.id === MASTER_ENVIRONMENT_ID ||
            _.find(envOrAlias.sys.aliases, alias => alias.sys.id === MASTER_ENVIRONMENT_ID)
          ) {
            return true;
          }
          return false;
        },

        /**
         * @name spaceContext#getAliasesIds
         * @description
         * Returns the ids of the environments aliases referencing the current environment
         * @returns array<string>
         */
        getAliasesIds: function(
          env = _.get(this, ['space', 'environment'], { sys: { id: MASTER_ENVIRONMENT_ID } })
        ) {
          if (!env.sys.aliases) return [];
          return env.sys.aliases.map(({ sys }) => sys.id);
        },

        /**
         * @name spaceContext#getAliases
         * @description
         * Returns full alias objects of all environment aliases in this space
         * @returns array<string>
         */
        getAliases: function() {
          return _.get(this, ['aliases'], []);
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
            return Promise.resolve(null);
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

        purgeContentPreviewCache();
        purgeApiKeyRepoCache();

        if (spaceContext.docPool) {
          spaceContext.docPool.destroy();
          spaceContext.docPool = null;
        }
        if (spaceContext.docConnection) {
          spaceContext.docConnection.close();
          spaceContext.docConnection = null;
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

      /**
       * Setup the environments and environmentMeta and add it to the spaceContext
       *
       * @param {SpaceContext} spaceContext
       * @param {string} uriEnvOrAliasId
       * @returns {Promise}
       */
      function setupEnvironments(spaceContext, uriEnvOrAliasId = MASTER_ENVIRONMENT_ID) {
        return createEnvironmentsRepo(spaceContext.endpoint)
          .getAll()
          .then(environments => {
            spaceContext.environments = deepFreeze(
              environments.sort(
                (envA, envB) =>
                  spaceContext.isMasterEnvironment(envB) - spaceContext.isMasterEnvironment(envA)
              )
            );
          })
          .then(() => {
            let environment = spaceContext.environments.find(
              ({ sys }) => sys.id === uriEnvOrAliasId
            );

            if (!environment) {
              // the current environment is aliased
              environment = spaceContext.environments.find(({ sys: { aliases = [] } }) =>
                aliases.some(({ sys }) => sys.id === MASTER_ENVIRONMENT_ID)
              );
            }
            spaceContext.space.environment = environment;
          })
          .then(() => {
            const aliases = spaceContext.getAliasesIds(spaceContext.space.environment);
            spaceContext.space.environmentMeta = {
              environmentId: spaceContext.getEnvironmentId(),
              isMasterEnvironment: spaceContext.isMasterEnvironment(spaceContext.space.environment),
              aliasId: aliases[0], // for now we assume that there is only alias ('master')
              optedIn: spaceContext.environments.some(
                ({ sys: { aliases = [] } }) => aliases.length > 0
              )
            };
          });
      }

      /**
       * Set-up aliases and add them to the spaceContext
       *
       * @param {SpaceContext} spaceContext
       * @param {string} uriEnvOrAliasId
       * @returns {Promise}
       */
      function setupAliases(spaceContext) {
        getSpaceFeature(spaceContext.space.getId(), ENVIRONMENT_ALIASING).then(aliasesEnabled => {
          if (aliasesEnabled) {
            return createAliasesRepo(spaceContext.endpoint)
              .getAll()
              .then(aliases => {
                spaceContext.aliases = deepFreeze(aliases);
              });
          }
          spaceContext.aliases = [];
          return;
        });
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
