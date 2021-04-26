import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
import { create as createViewMigrator } from 'saved-views-migrator';
import * as K from 'core/utils/kefir';
import { deepFreeze, deepFreezeClone } from 'utils/Freeze';
import { purgeContentPreviewCache } from 'features/content-preview';
import { purgeApiKeyRepoCache } from 'features/api-keys-management';

import * as ShareJSConnection from 'data/sharejs/Connection';
import shouldUseEnvEndpoint from 'data/shouldUseEnvEndpoint';
import APIClient from 'data/APIClient';
import * as Telemetry from 'i13n/Telemetry';
import createUserCache from 'data/userCache';
import TheLocaleStore from 'services/localeStore';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo';
import { create as createEnvironmentsRepo } from 'data/CMA/SpaceEnvironmentsRepo';
import createLocaleRepo from 'data/CMA/LocaleRepo';
import createUiConfigStore from 'data/UiConfig/Store';
import { createSpaceEndpoint } from 'data/Endpoint';
import * as PublishedCTRepo from 'data/ContentTypeRepo/Published';
import * as MembershipRepo from 'access_control/SpaceMembershipRepository';
import * as accessChecker from 'access_control/AccessChecker';
import * as DocumentPool from 'data/sharejs/DocumentPool';
import * as EnforcementsService from 'services/EnforcementsService';
import * as TokenStore from 'services/TokenStore';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import client from 'services/client';
import * as logger from 'services/logger';
import { createPubSubClientForSpace } from 'services/PubSubService';
import { GlobalEventBus, GlobalEvents } from 'core/services/GlobalEventsBus';

const MASTER_ENVIRONMENT_ID = 'master';

// Enforcements deinitialization function, when changing space
let enforcementsDeInit;

const spaceContext = initSpaceContext();
export const getSpaceContext = () => spaceContext;

// Util function to reset the spaceContext with spaceId (and environmentId) params
export const resetWithSpace = async (params) => {
  const spaceData = await TokenStore.getSpace(params.spaceId);
  return spaceContext.resetWithSpace(spaceData, params.environmentId);
};

/**
 * @ngdoc service
 * @name spaceContext
 *
 * @description
 * This service holds all context related to a space, including
 * contentTypes, users, and helper methods.
 */
function initSpaceContext() {
  const publishedCTsBus$ = K.createPropertyBus([]);

  const lastResetWithSpaceParams = {
    spaceId: undefined,
    environmentId: undefined,
  };

  GlobalEventBus.on(GlobalEvents.RefreshPublishedContentTypes, () => {
    if (spaceContext?.publishedCTs?.refresh) {
      spaceContext.publishedCTs.refresh();
    }
  });

  const context = {
    resettingSpace: false,

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
     * resources have been fetched (environments, locales, content types).
     *
     * @param {API.Space} spaceData
     * @param {string?} [uriEnvOrAliasId] environment id based on the uri
     * @returns {Promise<self>}
     */
    resetWithSpace: async function (spaceData, uriEnvOrAliasId) {
      if (
        spaceData.sys.id === lastResetWithSpaceParams.spaceId &&
        uriEnvOrAliasId === lastResetWithSpaceParams.environmentId
      ) {
        return;
      }

      lastResetWithSpaceParams.spaceId = spaceData.sys.id;
      lastResetWithSpaceParams.environmentId = uriEnvOrAliasId;

      spaceContext.resettingSpace = true;

      try {
        accessChecker.setSpace(spaceData);

        /**
         * @deprecated
         * This is a legacy client instance which returns entities as `.data` and uses
         * `X-Contentful-Skip-Transformation` for CMA requests which exposes internal IDs.
         * Use e.g. `spaceContext.cma` or `sdk.space`  instead wherever possible.
         */
        let space = client.newSpace(spaceData);

        if (uriEnvOrAliasId) {
          // creates env aware routes on space
          space = space.makeEnvironment(uriEnvOrAliasId, shouldUseEnvEndpoint);
        }

        const spaceId = spaceData.sys.id;

        spaceContext.endpoint = createSpaceEndpoint(
          Config.apiUrl(),
          spaceId,
          Auth,
          uriEnvOrAliasId
        );

        resetMembers(spaceContext);

        spaceContext.space = space;
        spaceContext.cma = new APIClient(spaceContext.endpoint);
        spaceContext.users = createUserCache(spaceContext.endpoint);
        spaceContext.organization = deepFreezeClone(spaceContext.getData('organization'));

        const localeRepoSpaceEndpoint = createSpaceEndpoint(
          Config.apiUrl(),
          spaceId,
          Auth,
          uriEnvOrAliasId || MASTER_ENVIRONMENT_ID
        );
        spaceContext.localeRepo = createLocaleRepo(localeRepoSpaceEndpoint);

        // TODO: publicly accessible docConnection is
        // used only in a process of creating space out
        // of a template. We shouldn't use it in newly
        // created code.

        spaceContext.docConnection = ShareJSConnection.create(
          Config.otUrl,
          Auth,
          spaceId,
          uriEnvOrAliasId || MASTER_ENVIRONMENT_ID
        );

        spaceContext.memberships = MembershipRepo.create(spaceContext.endpoint);
        spaceContext.members = createSpaceMembersRepo(spaceContext.endpoint);
        spaceContext.user = K.getValue(TokenStore.user$);

        // This happens here, rather than in `prelude.js`, since it's scoped to a space
        // and not the user, so the spaceId is required.
        enforcementsDeInit = EnforcementsService.init(spaceId);

        const start = Date.now();
        await Promise.all([
          setupEnvironments(spaceContext, uriEnvOrAliasId),
          TheLocaleStore.init(spaceContext.localeRepo),
          setupPublishedCTsBus(spaceContext).then(() => {
            const ctMap = spaceContext.publishedCTs
              .getAllBare()
              .reduce((acc, ct) => ({ ...acc, [ct.sys.id]: ct }), {});
            spaceContext.uiConfig = createUiConfigStore(
              space,
              spaceContext.endpoint,
              spaceContext.publishedCTs,
              createViewMigrator(ctMap)
            );
          }),
          (async () => {
            spaceContext.pubsubClient = await createPubSubClientForSpace(spaceId);
            spaceContext.docPool = await DocumentPool.create(
              spaceContext.docConnection,
              spaceContext.endpoint,
              spaceContext.pubsubClient,
              spaceContext.organization.sys.id,
              spaceId,
              uriEnvOrAliasId || MASTER_ENVIRONMENT_ID
            );
          })(),
        ]);
        Telemetry.record('space_context_http_time', Date.now() - start);
        // TODO: remove this after we have store with combined reducers on top level
        // string is hardcoded because this code _is_ temporary
        getModule('$rootScope').$broadcast('spaceContextUpdated');
      } catch (err) {
        logger.captureError(err);
      } finally {
        spaceContext.resettingSpace = false;
      }
      return spaceContext;
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
     * @deprecated
     * This is a legacy @contentful/client instance which returns entities as `.data` and uses
     * `X-Contentful-Skip-Transformation` for CMA requests which exposes internal IDs.
     * Use e.g. `spaceContext.cma` or `sdk.space`  instead wherever possible.
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
     * @name spaceContext#getAliasId
     * @description
     * Returns the current alias ID, if the user is accessing an alias
     * @returns string
     */
    getAliasId: function () {
      if (this.space) {
        return _.get(this, ['space', 'environmentMeta', 'aliasId'], null);
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

    isMasterEnvironmentById: function (envId) {
      const envOrAlias = _.get(
        this,
        ['environments'],
        [{ sys: { id: MASTER_ENVIRONMENT_ID } }]
      ).find(({ sys }) => sys.id === envId);
      return this.isMasterEnvironment(envOrAlias);
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

  resetMembers(context);
  return context;

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
        spaceContext.space.environment = spaceContext.environments.find(
          ({ sys }) => sys.id === uriEnvOrAliasId
        );

        if (!spaceContext.space.environment) {
          // the current environment is aliased
          spaceContext.space.environment = spaceContext.environments.find(
            ({ sys: { aliases = [] } }) => aliases.some(({ sys }) => sys.id === uriEnvOrAliasId)
          );
          spaceContext.space.environmentMeta = {
            environmentId: spaceContext.getEnvironmentId(),
            isMasterEnvironment: spaceContext.isMasterEnvironment(spaceContext.space.environment),
            optedIn: spaceContext.hasOptedIntoAliases(),
            aliasId: uriEnvOrAliasId,
          };
        } else {
          spaceContext.space.environmentMeta = {
            environmentId: spaceContext.getEnvironmentId(),
            isMasterEnvironment: spaceContext.isMasterEnvironment(spaceContext.space.environment),
            optedIn: spaceContext.hasOptedIntoAliases(),
          };
        }
      });
  }
}
