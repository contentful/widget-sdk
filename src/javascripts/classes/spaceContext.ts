import { getModule } from 'core/NgRegistry';
import _ from 'lodash';
// @ts-expect-error missing type declarations
import { create as createViewMigrator } from 'saved-views-migrator';
import * as K from 'core/utils/kefir';
import { deepFreeze, deepFreezeClone } from 'utils/Freeze';
import { purgeContentPreviewCache } from 'features/content-preview';
import { purgeApiKeyRepoCache } from 'features/api-keys-management';

import shouldUseEnvEndpoint from 'data/shouldUseEnvEndpoint';
import APIClient from 'data/APIClient';
import * as Telemetry from 'i13n/Telemetry';
import createUserCache from 'data/userCache';
import TheLocaleStore from 'services/localeStore';
import createSpaceMembersRepo from 'data/CMA/SpaceMembersRepo';
import { create as createEnvironmentsRepo } from 'data/CMA/SpaceEnvironmentsRepo';
import { createLocaleRepo } from 'data/CMA/LocaleRepo';
import createUiConfigStore from 'data/UiConfig/Store';
import { createSpaceEndpoint } from 'data/Endpoint';
import * as PublishedCTRepo from 'data/ContentTypeRepo/Published';
import * as MembershipRepo from 'access_control/SpaceMembershipRepository';
import * as accessChecker from 'access_control/AccessChecker';
import * as DocumentPool from 'data/DocumentPool/DocumentPool';
import * as EnforcementsService from 'services/EnforcementsService';
import * as TokenStore from 'services/TokenStore';
import * as Auth from 'Authentication';
import * as Config from 'Config';
import client from 'services/client';
import { captureError } from 'core/monitoring';
import { createPubSubClientForSpace } from 'services/PubSubService';
import { getSpaceEnvCMAClient, getCMAClient } from 'core/services/usePlainCMAClient';
import { GlobalEventBus, GlobalEvents } from 'core/services/GlobalEventsBus';
import {
  EnvironmentProps as Environment,
  EnvironmentAliasProps as EnvironmentAlias,
  EnvironmentProps,
  ContentTypeProps,
} from 'contentful-management/types';
import { SpaceContextType } from './spaceContextTypes';
import createResourceService from 'services/ResourceService';

const MASTER_ENVIRONMENT_ID = 'master';

// Enforcements deinitialization function, when changing space
let enforcementsDeInit;

const spaceContext = initSpaceContext();
export const getSpaceContext = (): SpaceContextType => spaceContext;

// Util function to reset the spaceContext with spaceId (and environmentId) params
export const resetWithSpace = async (params: { spaceId: string; environmentId?: string }) => {
  const spaceData = await TokenStore.getSpace(params.spaceId);
  return spaceContext.resetWithSpace(spaceData, params.environmentId);
};

/**
 * This service holds all context related to a space, including
 * contentTypes, users, and helper methods.
 */
function initSpaceContext(): SpaceContextType {
  const publishedCTsBus$ = K.createPropertyBus<any>([]);

  GlobalEventBus.on(GlobalEvents.RefreshPublishedContentTypes, () => {
    if (spaceContext?.publishedCTs?.refresh) {
      spaceContext.publishedCTs.refresh();
    }
  });

  const context: SpaceContextType = {
    cma: null as unknown as SpaceContextType['cma'],
    endpoint: null as unknown as SpaceContextType['endpoint'],
    memberships: null as unknown as SpaceContextType['memberships'],
    members: null as unknown as SpaceContextType['members'],
    pubsubClient: null as unknown as SpaceContextType['pubsubClient'],
    user: null as unknown as SpaceContextType['user'],
    organization: null as unknown as SpaceContextType['organization'],
    aliases: [],
    environments: [],
    docPool: null,
    users: null,
    resources: null as unknown as SpaceContextType['resources'],
    uiConfig: null,
    space: null as unknown as SpaceContextType['space'],
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
      refresh: () => Promise.resolve(undefined),
      getAllBare: () => [],
      get: () => null,
      publish: () => Promise.resolve({} as ContentTypeProps),
      unpublish: () => Promise.resolve({} as ContentTypeProps),
    },

    purge: function () {
      resetMembers(spaceContext);
    },

    resetWithSpace: async function (spaceData, uriEnvOrAliasId) {
      spaceContext.resettingSpace = true;

      try {
        accessChecker.setSpace(spaceData);

        /**
         * @deprecated
         * This is a legacy client instance which returns entities as `.data` and uses
         * `X-Contentful-Skip-Transformation` for CMA requests which exposes internal IDs.
         * Use e.g. `spaceContext.cma` or `sdk.space`  instead wherever possible.
         */
        // @ts-expect-error missing newSpace type declarations
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

        const cmaPlainClient = getCMAClient(
          {
            spaceId,
            environmentId: uriEnvOrAliasId || MASTER_ENVIRONMENT_ID,
          },
          {
            //batch client doesn't support headers param in
            //entry.get and asset.get, used by EntityRepo
            noBatch: true,
          }
        );

        const localeRepo = createLocaleRepo(cmaPlainClient);

        spaceContext.memberships = MembershipRepo.create(spaceContext.endpoint);
        spaceContext.members = createSpaceMembersRepo(spaceContext.endpoint);
        spaceContext.user = K.getValue(TokenStore.user$);

        // This happens here, rather than in `prelude.js`, since it's scoped to a space
        // and not the user, so the spaceId is required.
        enforcementsDeInit = EnforcementsService.init(spaceId);

        // @ts-expect-error supress error
        spaceContext.pubsubClient = await createPubSubClientForSpace(spaceId);

        const start = Date.now();

        await setupEnvironments(spaceContext, uriEnvOrAliasId);
        spaceContext.docPool = await DocumentPool.create(
          spaceContext.pubsubClient,
          spaceContext.organization.sys.id,
          spaceId,
          spaceContext.space.environment,
          cmaPlainClient,
          spaceContext.endpoint
        );
        // This should be initialized after `setupEnvironments`, so that
        // the environment is properly set on spaceContext.space
        spaceContext.resources = createResourceService(spaceContext.endpoint);

        await TheLocaleStore.init(localeRepo);

        // This has to be called after `setupEnvironments`, so that
        // the environment is properly set on spaceContext.space
        await setupPublishedCTsBus(spaceContext);

        const ctMap = spaceContext.publishedCTs
          .getAllBare()
          .reduce((acc, ct) => ({ ...acc, [ct.sys.id]: ct }), {});

        spaceContext.uiConfig = createUiConfigStore(
          space,
          spaceContext.endpoint,
          spaceContext.publishedCTs,
          createViewMigrator(ctMap)
        );
        Telemetry.record('space_context_http_time', Date.now() - start);
        // TODO: remove this after we have store with combined reducers on top level
        // string is hardcoded because this code _is_ temporary
        getModule('$rootScope').$broadcast('spaceContextUpdated');
      } catch (err) {
        captureError(err);
      } finally {
        spaceContext.resettingSpace = false;
      }
      return spaceContext;
    },

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

    getEnvironmentId: function () {
      if (this.space) {
        return _.get(this, ['space', 'environment', 'sys', 'id'], MASTER_ENVIRONMENT_ID);
      }
    },

    getAliasId: function () {
      if (this.space) {
        return _.get(this, ['space', 'environmentMeta', 'aliasId'], undefined);
      }
    },

    isMasterEnvironment: function (environment) {
      // @ts-expect-error ignore
      const envOrAlias: Pick<Environment, 'sys'> =
        environment ||
        _.get(this, ['space', 'environment'], { sys: { id: MASTER_ENVIRONMENT_ID } });

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
      return this.isMasterEnvironment(envOrAlias as any);
    },

    getAliasesIds: function (environment) {
      // @ts-expect-error ignore
      const env: Pick<Environment, 'sys'> =
        environment ||
        _.get(this, ['space', 'environment'], { sys: { id: MASTER_ENVIRONMENT_ID } });
      if (!env.sys.aliases) return [];
      return env.sys.aliases.map(({ sys }) => sys.id);
    },

    hasOptedIntoAliases: function (envs) {
      const environments = envs || _.get(this, ['environments'], []);
      return environments.some(({ sys: { aliases = [] } }) => aliases.length > 0);
    },

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
    const cma = getSpaceEnvCMAClient();

    /** @type {Published} */
    const publishedCTsForSpace = PublishedCTRepo.create(cma);

    _.assign(spaceContext.publishedCTs, _.omit(publishedCTsForSpace, 'items$'));
    await spaceContext.publishedCTs.refresh();
    // Synchronous first update since there's a current value now.
    K.onValue(publishedCTsForSpace.items$, (items) => publishedCTsBus$.set(items));
  }

  function resetMembers(spaceContext: SpaceContextType) {
    // Deinit the enforcement refreshing on space ID change, so that
    // the previous space ID enforcement information isn't queried
    if (enforcementsDeInit) {
      enforcementsDeInit();
    }

    spaceContext.uiConfig = null;
    // @ts-expect-error can be nullable
    spaceContext.space = null;
    spaceContext.users = null;
    spaceContext.resources = null;

    purgeContentPreviewCache();
    purgeApiKeyRepoCache();

    if (spaceContext.docPool) {
      spaceContext.docPool.destroy();
      spaceContext.docPool = null;
    }
  }

  /**
   * Setup the environments and environmentMeta and add it to the spaceContext
   *
   * @param {SpaceContext} spaceContext
   * @param {string} uriEnvOrAliasId
   * @returns {Promise}
   */
  function setupEnvironments(
    spaceContext: SpaceContextType,
    uriEnvOrAliasId: string = MASTER_ENVIRONMENT_ID
  ) {
    return createEnvironmentsRepo(spaceContext.endpoint)
      .getAll()
      .then(
        ({
          environments,
          aliases = [],
        }: {
          environments: Environment[];
          aliases: EnvironmentAlias[];
        }) => {
          spaceContext.environments = deepFreeze(
            environments.sort((envA, envB) => {
              return spaceContext.isMasterEnvironment(envB) > spaceContext.isMasterEnvironment(envA)
                ? 1
                : -1;
            })
          );
          spaceContext.aliases = deepFreeze(aliases);
        }
      )
      .then(() => {
        spaceContext.space.environment = spaceContext.environments.find(
          ({ sys }) => sys.id === uriEnvOrAliasId
        ) as EnvironmentProps;

        if (!spaceContext.space.environment) {
          // the current environment is aliased
          spaceContext.space.environment = spaceContext.environments.find(
            ({ sys: { aliases = [] } }) => aliases.some(({ sys }) => sys.id === uriEnvOrAliasId)
          ) as EnvironmentProps;
          spaceContext.space.environmentMeta = {
            environmentId: spaceContext.getEnvironmentId() as string,
            isMasterEnvironment: spaceContext.isMasterEnvironment(spaceContext.space.environment),
            optedIn: spaceContext.hasOptedIntoAliases(),
            aliasId: uriEnvOrAliasId,
          };
        } else {
          spaceContext.space.environmentMeta = {
            environmentId: spaceContext.getEnvironmentId() as string,
            isMasterEnvironment: spaceContext.isMasterEnvironment(spaceContext.space.environment),
            optedIn: spaceContext.hasOptedIntoAliases(),
          };
        }
      });
  }
}
