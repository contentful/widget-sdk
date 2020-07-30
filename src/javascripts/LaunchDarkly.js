import _ from 'lodash';
import * as LDClient from 'ldclient-js';
import {
  getOrgRole,
  isUserOrgCreator,
  getUserAgeInDays,
  ownsAtleastOneOrg,
  hasAnOrgWithSpaces,
  isAutomationTestUser,
  getUserSpaceRoles,
} from 'data/User';
import * as config from 'Config';
import * as logger from 'services/logger';
import { isFlagOverridden, getFlagOverride } from 'debug/EnforceFlags';
import { getOrganization, getSpace, getUser, getSpacesByOrganization } from 'services/TokenStore';
import isLegacyEnterprise from 'data/isLegacyEnterprise';
import { getOrgFeature } from 'data/CMA/ProductCatalog';

let client;
let cache = {};

export const FLAGS = {
  WALK_FOR_ME: 'feature-fe-10-2017-walkme-integration-eli-lilly',
  ENVIRONMENTS_FLAG: 'feature-dv-11-2017-environments',
  ENTRY_COMMENTS: 'feature-04-2019-entry-comments',
  ENTITY_EDITOR_CMA_EXPERIMENT: 'feature-pen-07-2019-fake-cma-calls-experiment-to-replace-sharejs',
  APP_MANAGEMENT_VIEWS: 'feature-ext-04-2020-app-backends',
  PRICING_2020_RELEASED: 'feature-ogg-06-2020-enable-pricing-2020-features',
  PAYING_PREV_V2_ORG: 'feature-ogg-06-2020-v2-team-user',
  TEST_IF_LD_IS_WORKING: 'test-if-launch-darkly-is-working',
  ALL_REFERENCES_DIALOG: 'feature-pulitzer-02-2020-all-reference-dialog',
  NEW_STATUS_SWITCH: 'feature-pulitzer-03-2020-new-status-switch',
  ADD_TO_RELEASE: 'feature-pulitzer-05-2020-add-to-release',
  SHAREJS_REMOVAL: 'feature-pen-04-2020-sharejs-removal-multi',
  PRICING_2020_WARNING: 'feature-hejo-06-2020-pricing-2020-in-app-communication',
  NEW_FIELD_DIALOG: 'react-migration-new-content-type-field-dialog',
  ENTITY_SELECTOR_MIGRATION: 'feature-pulitzer-07-2020-entity-selector-migration',
};

/*
  During testing, allows for clearing the flags cache.

  This is necessary since we cache the flags from LD, but do not create a single instance
  of this service and then expose it somewhere in the application.

  TODO: Turn this into a class/singleton
 */
export function clearCache() {
  if (process.env.NODE_ENV === 'test') {
    client = null;
    cache = {};
  } else {
    throw new Error('Clearing LaunchDarkly client cache is only available in testing.');
  }
}

/**
 * @description
 * Builds a LaunchDarkly user with custom data to help us arget users.
 *
 * Custom attributes that can be used in targeting users:
 * - currentOrgId : current org in the app the user is in the context of
 * - currentOrgSubscriptionStatus : one of free, paid, free_paid, trial (works for V1 only)
 * - currentOrgPlanIsEnterprise : true if the current org is on an enterprise plan (works for V1 only)
 * - currentOrgHasSpace : true if the current org has a space
 * - currentOrgPricingVersion : the current organization pricing version, currently either `pricing_version_1` or `pricing_version_2`
 * - currentOrgHasPaymentMethod : the organizations that have no payment method added, regardless of their pricing version

 * - currentUserOrgRole : user's role in current org
 * - currentUserHasAtleastOneSpace : true if the user has atleast one space in all the orgs he/she is a member of
 * - currentUserOwnsAtleastOneOrg : true if the user is the owner of atleast one org
 * - currentUserAge : days since user signed up
 * - currentUserCreationDate: current user creation date as a unix timestamp (generated by moment and not the same as Date.now())
 * - currentUserIsCurrentOrgCreator : true if the current org was created by the current user
 * - currentUserSignInCount : count of the number of times the current user has signed in
 * - isNonPayingUser : true if non of the orgs the user belongs to is paying us (works for V1 only)
 * - currentSpaceId : id of the space the user is in
 * - currentUserSpaceRole : list of lower case roles that user has for current space
 * - isAutomationTestUser : true if the current user was created by the automation suite
 *
 * @param {Object} user
 * @param {Object} org
 * @param {Object} space
 *
 * @returns {Object} customData
 */

async function ldUser({ user, org, space, environmentId }) {
  let customData = {
    currentUserSignInCount: user.signInCount,

    // by default, if there is no current space, we pass empty array
    currentUserSpaceRole: [],

    isAutomationTestUser: isAutomationTestUser(user),
    currentUserOwnsAtleastOneOrg: ownsAtleastOneOrg(user),
    currentUserAge: getUserAgeInDays(user),
    currentUserCreationDate: new Date(user.sys.createdAt).getTime(),
  };

  if (org) {
    const {
      sys: { id: organizationId },
    } = org;
    const spacesByOrg = getSpacesByOrganization();

    // Currently this is the best way to find out if an org is v2 commited (enterprise)
    // The request is likely to be cached by dataloader
    // By default all committed orgs on pricing v2 have this feature enabled in the product catalog
    // but because the Product Catalog enables overrides, THIS IS NOT 100% RELIABLE for
    // determining if the org is V2 committed
    const currentOrgHasSsoSelfConfigFeature = await getOrgFeature(
      organizationId,
      'self_configure_sso',
      false
    );

    customData = _.assign({}, customData, {
      currentOrgId: organizationId,
      currentOrgSubscriptionStatus: _.get(org, 'subscription.status', null),
      currentOrgPricingVersion: org.pricingVersion,
      currentOrgPlanIsEnterprise: isLegacyEnterprise(org),
      currentOrgHasSpace: Boolean(_.get(spacesByOrg, [organizationId, 'length'], 0)),
      currentOrgHasPaymentMethod: Boolean(org.isBillable),
      currentOrgCreationDate: new Date(org.sys.createdAt).getTime(),
      currentOrgHasSsoSelfConfigFeature,
      currentOrgHasSsoEnabled: _.get(org, 'hasSsoEnabled', false),
      currentUserOrgRole: getOrgRole(user, organizationId),
      currentUserHasAtleastOneSpace: hasAnOrgWithSpaces(spacesByOrg),
      currentUserIsCurrentOrgCreator: isUserOrgCreator(user, org),
      isNonPayingUser: !['paid', 'free_paid'].includes(_.get(org, ['subscription', 'status'])),
    });
  }

  if (space) {
    const roles = getUserSpaceRoles(space);
    customData = _.assign({}, customData, {
      currentSpaceId: space.sys.id,
      currentUserSpaceRole: roles,
    });
  }

  if (environmentId) {
    customData = _.assign({}, customData, {
      currentSpaceEnvironmentId: environmentId,
    });
  }

  return {
    key: user.sys.id,
    custom: _.omitBy(customData, _.isNull),
  };
}

/**
 * @usage[js]
 * import { getVariation } from 'LaunchDarkly'
 *
 * const variation = await getVariation('my-test-or-feature-flag', { organizationId: '1234' })
 *
 * @description
 * This function returns a promise that resolves to the variation for the
 * provided feature flag for the given organizationId or spaceId. If the flag name
 * is overridden using `ui_enable_flags`, then a promise that resolves to the
 * overridden value is returned.
 *
 * NOTE: a flag's value can be overridden using ui_(enable|disable)_flags query param.
 *
 * Guarantees provided:
 * 1. If flag is overridden
 *   1. The promise returned will resolve to the overridden value of the flag
 *
 * 2. If the flag is NOT overridden
 *   1. The promise will settle only when LD is ready for the given context
 *      where context is a combination of current user, and given org and space IDs.
 *   2. The promise will resolve with the variation for the provided flag name
 *      if it receives a variation from it from LD.
 *   3. The promise will resolve with `undefined` if an error occurs, such as the flag
 *      not existing in LaunchDarkly.
 *
 *      NOTE: this can also happen in rare cases even if a flag does exist (e.g. LD
 *      service is down) and you should keep it in mind if your default value is not
 *      falsy.
 *
 * @param {String} flagName
 * @returns {Promise<Variation>}
 */
export async function getVariation(flagName, { organizationId, spaceId, environmentId } = {}) {
  /**
   * if the flag is overridden, don't wait to
   * connect to LD before returning the overridden
   * variation.
   */
  if (isFlagOverridden(flagName)) {
    return getFlagOverride(flagName);
  }

  const user = await getUser();

  // If the client doesn't exist, initialize with a basic LD user
  // object (no org or space data)
  if (!client) {
    const clientUser = await ldUser({ user, environmentId });

    client = LDClient.initialize(config.launchDarkly.envId, clientUser);
  }

  // The cache key will look like this:
  //
  // Only org ID:
  // `org_abcd1234:`
  //
  // Only space ID:
  // `:space_abcd1234`
  //
  // Org and space ID:
  // `org_abcd1234:space_abcd1234`
  //
  // No ID:
  // `:`
  const key = `${organizationId ? organizationId : ''}:${spaceId ? spaceId : ''}${
    environmentId ? environmentId : ''
  }`;

  let flagsPromise = _.get(cache, key, null);

  if (!flagsPromise) {
    flagsPromise = createFlagsPromise({ user, organizationId, spaceId, environmentId });

    // Set the initial flags promise
    _.set(cache, key, flagsPromise);

    // Await for the promise, in case the org/space doesn't exist
    const initialPromiseValue = await flagsPromise;

    // If the initial promise value is undefined, unset the promise in the
    // cache
    if (initialPromiseValue === undefined) {
      _.set(cache, key, undefined);

      return undefined;
    }
  }

  const getFlagValue = await flagsPromise;

  return getFlagValue(flagName);
}

/*
  Creates a promise that returns either the value of the flag in LaunchDarkly
  or undefined
 */
async function createFlagsPromise({ user, organizationId, spaceId, environmentId }) {
  // Get the user data that will be used for LD client variation data
  await client.waitForInitialization();

  let org;
  let space;

  // Attempt to get the org and space, if given an ID.
  //
  // If the ID results in an unknown org or space, log the
  // error to Bugsnag and return undefined.
  try {
    org = organizationId ? await getOrganization(organizationId) : null;
  } catch (e) {
    logger.logError(`Invalid org ID ${organizationId} given to LD`, {
      groupingHash: 'InvalidLDOrgId',
      data: { organizationId },
    });

    return undefined;
  }

  try {
    space = spaceId ? await getSpace(spaceId) : null;
  } catch (e) {
    logger.logError(`Invalid space ID ${spaceId} given to LD`, {
      groupingHash: 'InvalidLDSpaceId',
      data: { spaceId },
    });

    return undefined;
  }

  const clientUser = await ldUser({ user, org, space, environmentId });
  await client.identify(clientUser);

  // Get and save the flags to the cache
  const flags = client.allFlags();

  // Now that we have all the flags for this identified user, return
  // a function that returns the given flagName variation
  return (flagName) => {
    const variation = _.get(flags, flagName, undefined);

    // LD could not find a flag with given name, log error and return undefined
    if (variation === undefined) {
      logger.logError(`Invalid flag ${flagName}`, {
        groupingHash: 'InvalidLDFlag',
        data: { flagName },
      });

      return undefined;
    }

    if (typeof variation === 'string') {
      try {
        return JSON.parse(variation);
      } catch (e) {
        // Should never happen, but if the variation data could not be parsed
        // log the error and return undefined
        logger.logError(`Invalid variation JSON for ${flagName}`, {
          groupingHash: 'InvalidLDVariationJSON',
          data: { variation },
        });

        return undefined;
      }
    }

    return variation;
  };
}
