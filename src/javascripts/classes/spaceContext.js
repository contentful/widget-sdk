import { registerFactory } from 'NgRegistry';
import _ from 'lodash';
import { create as createViewMigrator } from 'saved-views-migrator';
import * as K from 'utils/kefir';
import { deepFreeze, deepFreezeClone } from 'utils/Freeze';
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
    function spaceContext($rootScope) {
      const publishedCTsBus$ = K.createPropertyBus([]);

      // Enforcements deinitialization function, when changing space
      let enforcementsDeInit;

      let ShareJSConnection;
      let shouldUseEnvEndpoint;
      let APIClient;
      let Telemetry;
      let createUserCache;
      let TheLocaleStore;
      let createSpaceMembersRepo;
      let createEnvironmentsRepo;
      let createLocaleRepo;
      let createUiConfigStore;
      let createSpaceEndpoint;
      let createPubSubClientForSpace;
      let PublishedCTRepo;
      let MembershipRepo;
      let accessChecker;
      let DocumentPool;
      let EnforcementsService;
      let TokenStore;
      let Auth;
      let Config;
      let client;

      const spaceContext = {
        async init() {
          [
            ShareJSConnection,
            { default: shouldUseEnvEndpoint },
            { default: APIClient },
            Telemetry,
            { default: createUserCache },
            { default: TheLocaleStore },

            { default: createSpaceMembersRepo },
            { create: createEnvironmentsRepo },
            { default: createLocaleRepo },
            { default: createUiConfigStore },
            { createSpaceEndpoint },
            PublishedCTRepo,
            MembershipRepo,
            accessChecker,
            DocumentPool,
            EnforcementsService,
            TokenStore,
            Auth,
            Config,
            { default: client },
            { createPubSubClientForSpace },
          ] = await Promise.all([
            import(/* webpackMode: "eager" */ 'data/sharejs/Connection'),
            import(/* webpackMode: "eager" */ 'data/shouldUseEnvEndpoint'),
            import(/* webpackMode: "eager" */ 'data/APIClient'),
            import(/* webpackMode: "eager" */ 'i13n/Telemetry'),
            import(/* webpackMode: "eager" */ 'data/userCache'),
            import(/* webpackMode: "eager" */ 'services/localeStore'),
            import(/* webpackMode: "eager" */ 'data/CMA/SpaceMembersRepo'),
            import(/* webpackMode: "eager" */ 'data/CMA/SpaceEnvironmentsRepo'),
            import(/* webpackMode: "eager" */ 'data/CMA/LocaleRepo'),
            import(/* webpackMode: "eager" */ 'data/UiConfig/Store'),
            import(/* webpackMode: "eager" */ 'data/Endpoint'),
            import(/* webpackMode: "eager" */ 'data/ContentTypeRepo/Published'),
            import(/* webpackMode: "eager" */ 'access_control/SpaceMembershipRepository'),
            import(/* webpackMode: "eager" */ 'access_control/AccessChecker'),
            import(/* webpackMode: "eager" */ 'data/sharejs/DocumentPool'),
            import(/* webpackMode: "eager" */ 'services/EnforcementsService'),
            import(/* webpackMode: "eager" */ 'services/TokenStore'),
            import(/* webpackMode: "eager" */ 'Authentication'),
            import(/* webpackMode: "eager" */ 'Config'),
            import(/* webpackMode: "eager" */ 'services/client'),
            import(/* webpackMode: "eager" */ 'services/PubSubService'),
          ]);
        },

        /**
         * @type {Published}
         * @description
         * A property containing data on the published CTs in the current space and space-specific repository methods.
         * Initialized with a predefined items$ bus to keep the bus reference the same between space switches.
         * It is updated in resetWithSpace method once we know we are in the context of a space.
         */
        publishedCTs: {
          items$: publishedCTsBus$.property,
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
         * @param {string?} uriEnvOrAliasId environment id based on the uri
         * @returns {Promise<self>}
         */
        resetWithSpace: async function (spaceData, uriEnvOrAliasId) {
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
          self.user = K.getValue(TokenStore.user$);

          // This happens here, rather than in `prelude.js`, since it's scoped to a space
          // and not the user, so the spaceId is required.
          enforcementsDeInit = EnforcementsService.init(spaceId);

          const start = Date.now();
          return Promise.all([
            setupEnvironments(self, uriEnvOrAliasId),
            TheLocaleStore.init(self.localeRepo),
            setupPublishedCTsBus(self).then(() => {
              const ctMap = self.publishedCTs
                .getAllBare()
                .reduce((acc, ct) => ({ ...acc, [ct.sys.id]: ct }), {});
              self.uiConfig = createUiConfigStore(
                space,
                self.endpoint,
                self.publishedCTs,
                createViewMigrator(ctMap)
              );
            }),
            (async () => {
              self.pubsubClient = await createPubSubClientForSpace(spaceId);
            })(),
            (async () => {
              self.docPool = await DocumentPool.create(
                self.docConnection,
                self.endpoint,
                self.organization.sys.id,
                spaceId
              );
            })(),
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
        getId: function () {
          return this.space && this.space.getId();
        },

        /**
         * @description
         * Returns current space, if set
         * @returns Object
         */
        getSpace: function () {
          return this.space;
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
        isMasterEnvironment: function (
          envOrAlias = _.get(this, ['space', 'environment'], { sys: { id: MASTER_ENVIRONMENT_ID } })
        ) {
          if (
            envOrAlias.sys.id === MASTER_ENVIRONMENT_ID ||
            _.find(envOrAlias.sys.aliases, (alias) => alias.sys.id === MASTER_ENVIRONMENT_ID)
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
        getAliasesIds: function (
          env = _.get(this, ['space', 'environment'], { sys: { id: MASTER_ENVIRONMENT_ID } })
        ) {
          if (!env.sys.aliases) return [];
          return env.sys.aliases.map(({ sys }) => sys.id);
        },

        /**

         /**
         * @name spaceContext#hasOptedIntoAliases
         * @description
         * Checks if the space is opted in to the environment alias feature
         * @returns boolean
         */
        hasOptedIntoAliases: function (environments = _.get(this, ['environments'], [])) {
          return environments.some(({ sys: { aliases = [] } }) => aliases.length > 0);
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
          const data = _.get(this, 'space.data', {});
          return _.get(data, path, defaultValue);
        },
      };

      resetMembers(spaceContext);
      return spaceContext;

      /**
       * Extend the publishedCTs prop with the space-specific repo methods excluding
       * the repo items$ bus – to keep the same instance between space switches.
       * That means that calling on provided methods (like repo.publish()) will update the repo.items$, but not self.publishedCTs.items$.
       * So the additional listener on values changes is required to keep (self.publishedCTs.items$ = publishedCTsBus$) bus up-to-date.
       */
      async function setupPublishedCTsBus(spaceContext) {
        /** @type {Published} */
        const publishedCTsForSpace = PublishedCTRepo.create(spaceContext.space);
        _.assign(spaceContext.publishedCTs, _.omit(publishedCTsForSpace, 'items$'));
        await spaceContext.publishedCTs.refresh();
        // Synchronous first update since there's a current value now.
        K.onValue(publishedCTsForSpace.items$, (items) => publishedCTsBus$.set(items));
      }

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
       * Setup the environments and environmentMeta and add it to the spaceContext
       *
       * @param {SpaceContext} spaceContext
       * @param {string} uriEnvOrAliasId
       * @returns {Promise}
       */
      function setupEnvironments(spaceContext, uriEnvOrAliasId = MASTER_ENVIRONMENT_ID) {
        return createEnvironmentsRepo(spaceContext.endpoint)
          .getAll()
          .then(({ environments, aliases = [] }) => {
            spaceContext.environments = deepFreeze(
              environments.sort(
                (envA, envB) =>
                  spaceContext.isMasterEnvironment(envB) - spaceContext.isMasterEnvironment(envA)
              )
            );
            spaceContext.aliases = deepFreeze(aliases);
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
              optedIn: spaceContext.hasOptedIntoAliases(),
            };
          });
      }
    },
  ]);
}
