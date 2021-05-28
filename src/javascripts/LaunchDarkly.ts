import * as config from 'Config';
import * as DegradedAppPerformance from 'core/services/DegradedAppPerformance';
import { getOrgFeature, OrganizationFeatures } from 'data/CMA/ProductCatalog';
import isLegacyEnterprise from 'data/isLegacyEnterprise';
import {
  getOrgRole,
  getUserAgeInDays,
  getUserSpaceRoles,
  hasAnOrgWithSpaces,
  isAutomationTestUser,
  isUserOrgCreator,
  ownsAtleastOneOrg,
} from 'data/User';
import { getFlagOverride, isFlagOverridden } from 'debug/EnforceFlags';
import * as LDClient from 'ldclient-js';
import _, { isEqual, endsWith } from 'lodash';
import { captureError } from 'core/monitoring';
import { getOrganization, getSpace, getSpacesByOrganization, getUser } from 'services/TokenStore';
import { Organization, SpaceData, User } from 'classes/spaceContextTypes';
import PQueue from 'p-queue';

const flagPromiseQueue = new PQueue({ concurrency: 1 });

const MISSING_VARIATION_VALUE = '__missing_variation_value__';

let cachedIdentifiedUser: LDClient.LDUser | null = null;
let client: LDClient.LDClient | null = null;
let variationCache = {};
let variationCacheResolved = {};

let initializationPromise: Promise<void> | null = null;
let initialized = false;

export enum FLAGS {
  ENVIRONMENTS_FLAG = 'feature-dv-11-2017-environments',
  ENTRY_COMMENTS = 'feature-04-2019-entry-comments',
  ADD_TO_RELEASE = 'feature-pulitzer-05-2020-add-to-release',
  NEW_FIELD_DIALOG = 'react-migration-new-content-type-field-dialog',
  SSO_SETUP_NO_REDUX = 'feature-hejo-08-2020-sso-setup-no-redux',
  ENTITLEMENTS_API = 'feature-hejo-11-2020-entitlements-api',
  SUBSCRIPTION_PAGE_REBRANDING = 'feature-ahoy-04-2021-subscription-page-rebranding',
  SPACE_SECTION_REBRANDING = 'feature-ahoy-05-2021-space-section-rebranding',
  SPACE_PLAN_ASSIGNMENT = 'feature-hejo-08-2020-space-plan-assignment',
  SPACE_PLAN_ASSIGNMENT_EXPERIMENT = 'feature-hejo-09-2020-space-plan-assignment-experiment',
  CREATE_SPACE_FOR_SPACE_PLAN = 'feature-hejo-12-2020-create-space-for-space-plan',
  WORKFLOWS_APP = 'ext-09-2020-enable-workflows',
  COMPOSE_LAUNCH_PURCHASE = 'feature-ahoy-11-2020-compose-launch-purchase',
  PATCH_ENTRY_UPDATES = 'feature-penguin-12-2020-patch-entry-updates',
  COMPOSE_APP_LISTING_EAP = 'feature-ext-12-2020-contentful-apps-compose-eap',
  LAUNCH_APP_LISTING_EAP = 'feature-ext-12-2020-contentful-apps-launch-eap',
  REFERENCE_TREE_BULK_ACTIONS_SUPPORT = 'feature-pulitzer-01-2021-reference-tree-bulk-actions',
  REACT_MIGRATION_CT = 'react-migration-10-2020-content-type-editor',
  APP_HOSTING_UI = 'feature-extensibility-03-2021-app-hosting-ui',
  HIGH_VALUE_LABEL = 'feature-hejo-03-2021-high-value-label',
  EXPERIMENT_A_A = 'test-growth-04-2021-a-a-exp',
  V1_MIGRATION_2021_WARNING = 'feature-hejo-04-2021-v1-migration',
  REQUEST_RETRY_EXPERIMENT = 'dev-workflows-02-2021-request-retry-experiment',
  ENVIRONMENT_POLICIES = 'feature-dev-workflows-04-2021-environment-policies',
  NEW_ONBOARDING_FLOW = 'feature-growth-04-2021-new-onboarding-flow',
  RECOVERABLE_ONBOARDING_FLOW = 'feature-growth-04-2021-recoverable-onboarding-flow',
  EXPERIMENT_ONBOARDING_MODAL = 'test-growth-05-2021-onboarding-modal',
  NEW_COWORKER_INVITE_CARD = 'feature-growth-05-2021-new-coworker-invite-card',
  EXPERIENCE_SDK_PAGE_LOCATION = 'feature-ext-05-2021-experience-sdk-page-location',

  // So that we can test the fallback mechanism without needing to rely on an actual
  // flag above, we use these special flags.
  __FLAG_FOR_UNIT_TESTS__ = 'test-flag',
  __SECOND_FLAG_FOR_UNIT_TEST__ = 'test-flag-2',
}

const FALLBACK_VALUES = {
  [FLAGS.ENVIRONMENTS_FLAG]: true,
  [FLAGS.ENTRY_COMMENTS]: true,
  [FLAGS.ADD_TO_RELEASE]: false,
  [FLAGS.NEW_FIELD_DIALOG]: false,
  [FLAGS.SSO_SETUP_NO_REDUX]: false,
  [FLAGS.ENTITLEMENTS_API]: false,
  [FLAGS.SUBSCRIPTION_PAGE_REBRANDING]: false,
  [FLAGS.SPACE_SECTION_REBRANDING]: false,
  [FLAGS.SPACE_PLAN_ASSIGNMENT]: false,
  [FLAGS.SPACE_PLAN_ASSIGNMENT_EXPERIMENT]: false,
  [FLAGS.CREATE_SPACE_FOR_SPACE_PLAN]: false,
  [FLAGS.WORKFLOWS_APP]: false,
  [FLAGS.COMPOSE_LAUNCH_PURCHASE]: false,
  [FLAGS.PATCH_ENTRY_UPDATES]: false,
  [FLAGS.COMPOSE_APP_LISTING_EAP]: false,
  [FLAGS.LAUNCH_APP_LISTING_EAP]: false,
  [FLAGS.APP_HOSTING_UI]: false,
  [FLAGS.HIGH_VALUE_LABEL]: false,
  [FLAGS.ENVIRONMENT_POLICIES]: false,
  [FLAGS.V1_MIGRATION_2021_WARNING]: false,
  [FLAGS.NEW_ONBOARDING_FLOW]: false,
  [FLAGS.RECOVERABLE_ONBOARDING_FLOW]: false,
  [FLAGS.NEW_COWORKER_INVITE_CARD]: false,
  [FLAGS.EXPERIENCE_SDK_PAGE_LOCATION]: false,

  // TODO: remove or flip this flag to `true` once it's fully rolled out
  [FLAGS.REFERENCE_TREE_BULK_ACTIONS_SUPPORT]: false,

  [FLAGS.REACT_MIGRATION_CT]: false,

  [FLAGS.REQUEST_RETRY_EXPERIMENT]: false,

  [FLAGS.EXPERIMENT_A_A]: null,
  [FLAGS.EXPERIMENT_ONBOARDING_MODAL]: null,

  // See above
  [FLAGS.__FLAG_FOR_UNIT_TESTS__]: 'fallback-value',
  [FLAGS.__SECOND_FLAG_FOR_UNIT_TEST__]: 'fallback-value-2',
};

/*
  During testing, allows for clearing the flags cache.

  This is necessary since we cache the flags from LD, but do not create a single instance
  of this service and then expose it somewhere in the application.

  TODO: Turn this into a class/singleton
 */
export function reset() {
  if (process.env.NODE_ENV === 'test') {
    client = null;
    cachedIdentifiedUser = {};
    variationCache = {};
    variationCacheResolved = {};
    initializationPromise = null;
    initialized = false;
  } else {
    throw new Error('Clearing LaunchDarkly client cache is only available in testing.');
  }
}

interface CustomData {
  currentOrgId?: string; // current org in the app the user is in the context of
  currentOrgSubscriptionStatus?: string; // one of free, paid, free_paid, trial (works for V1 only)
  currentOrgPlanIsEnterprise?: boolean; // true if the current org is on an enterprise plan (works for V1 only)
  currentOrgHasSpace?: boolean; // true if the current org has a space

  currentOrgPricingVersion?: 'pricing_version_1' | 'pricing_version_2'; //the current organization pricing version, currently either `pricing_version_1` or `pricing_version_2`
  currentOrgHasPaymentMethod?: boolean; //  the organizations that have no payment method added, regardless of their pricing version

  currentUserOrgRole?: string; //user's role in current org
  currentUserHasAtleastOneSpace?: boolean; // true if the user has atleast one space in all the orgs he/she is a member of
  currentUserOwnsAtleastOneOrg: boolean; // true if the user is the owner of atleast one org
  currentUserAge: number; // days since user signed up
  currentUserCreationDate: number; // current user creation date as a unix timestamp
  currentUserIsFromContentful: boolean; //User has a @contentful.com email address, eases targeting for refactorings
  currentUserIsCurrentOrgCreator?: boolean; //true if the current org was created by the current user
  currentUserSignInCount: number; // count of the number of times the current user has signed in
  isNonPayingUser?: boolean; // true if non of the orgs the user belongs to is paying us (works for V1 only)
  currentSpaceId?: string; //id of the space the user is in
  currentUserSpaceRole: string[]; // list of lower case roles that user has for current space
  isAutomationTestUser: boolean; // true if the current user was created by the automation suite
}

async function ldUser({
  user,
  org,
  space,
  environmentId,
}: {
  user: User;
  org?: Organization;
  space?: SpaceData;
  environmentId?: string;
}): Promise<LDClient.LDUser> {
  let customData: CustomData = {
    currentUserSignInCount: user.signInCount,

    // by default, if there is no current space, we pass empty array
    currentUserSpaceRole: [],

    isAutomationTestUser: isAutomationTestUser(user),
    currentUserOwnsAtleastOneOrg: ownsAtleastOneOrg(user),
    currentUserAge: getUserAgeInDays(user),
    currentUserCreationDate: new Date(user.sys.createdAt).getTime(),
    currentUserIsFromContentful: endsWith(user.email, '@contentful.com'),
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
      OrganizationFeatures.SELF_CONFIGURE_SSO,
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

function getCacheKey(
  flagName: FLAGS,
  organizationId?: string,
  spaceId?: string,
  environmentId?: string
) {
  return `${flagName}:${organizationId ? organizationId : ''}:${spaceId ? spaceId : ''}:${
    environmentId ? environmentId : ''
  }`;
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
 *   1. If LaunchDarkly is not available, the predefined fallback value for the given
 *      flag will be resolved
 *   2. If an error occurs while getting the variation, such as `getSpace` is given an
 *      invalid spaceId, the fallback value will be resolved
 *   3. Otherwise, the variation for the given flag and context data will be resolved.
 */
interface GetVariationOptions {
  organizationId?: string;
  spaceId?: string;
  environmentId?: string;
}
export async function getVariation(
  flagName: FLAGS,
  { organizationId, spaceId, environmentId }: GetVariationOptions = {}
) {
  /**
   * if the flag is overridden, don't wait to
   * connect to LD before returning the overridden
   * variation.
   */
  if (isFlagOverridden(flagName)) {
    return getFlagOverride(flagName);
  }

  const asyncError = new Error('LaunchDarkly error');

  // Since there isn't a fallback value, simply return undefined
  if (!Object.values(FLAGS).includes(flagName)) {
    logAsyncError(asyncError, 'LD flag was not defined in the app FLAGS map', {
      flagName,
      organizationId,
      spaceId,
      environmentId,
    });

    return undefined;
  }

  const user = await getUser();

  // If the client doesn't exist, initialize with a basic LD user
  // object (no additional data besides the user)
  if (!client) {
    // Since this is a basic user, we don't set it as the current identified user above
    const clientUser = await ldUser({ user });

    client = LDClient.initialize(config.launchDarkly.envId, clientUser);
  }

  if (!initialized) {
    if (!initializationPromise) {
      initializationPromise = client.waitForInitialization();
    }

    try {
      await initializationPromise;

      initialized = true;
    } catch {
      // If LaunchDarkly couldn't initialize, return whatever the fallback value is
      // for the flag and reset the state so we can try to initialize later
      initializationPromise = null;
      client = null;

      DegradedAppPerformance.trigger('LaunchDarkly');

      return FALLBACK_VALUES[flagName];
    }
  }

  // The cache key will look like this:
  //
  // Only org ID:
  // `<flagName>:org_abcd1234::`
  //
  // Only space ID:
  // `<flagName>::space_abcd1234:`
  //
  // Org and space ID:
  // `<flagName>:org_abcd1234:space_abcd1234:`
  //
  // Org, space, and env ID
  // `<flagName>:org_abcd1234:space_abcd1234:env_abcd1234`
  //
  // No IDs:
  // `<flagName>:::`
  const key = getCacheKey(flagName, organizationId, spaceId, environmentId);
  let variationPromise = _.get(variationCache, key, null);

  if (!variationPromise) {
    variationPromise = flagPromiseQueue.add(() =>
      // Client won't be null by the time we get here, it's just null-able due to the tests
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      createFlagPromise(client!, flagName, {
        user,
        organizationId,
        spaceId,
        environmentId,
      })
        .catch((error) => {
          // This shouldn't happen, but in case there is some error thrown by
          // `createFlagPromise`, log it and return the fallback value
          logAsyncError(asyncError, 'Unexpected error occurred while getting variation', {
            flagName,
            organizationId,
            spaceId,
            environmentId,
            error,
          });

          return {
            success: false,
            message: 'Unexpected LaunchDarkly error',
            data: {
              flagName,
              organizationId,
              spaceId,
              environmentId,
            },
          } as FlagPromiseFailure;
        })
        .then((resultObject) => {
          // If the flag promise errs in some way, unset the cached promise
          // and resolve with the fallback value.
          //
          // Possible error cases include:
          // - client.identify throws
          // - the given org ID or space ID is invalid or not available in the token
          // - the variation is missing or the variation is not valid JSON
          if (resultObject.success === false) {
            _.set(variationCache, key, undefined);

            logAsyncError(asyncError, resultObject.message, resultObject.data);

            DegradedAppPerformance.trigger('LaunchDarkly');

            return FALLBACK_VALUES[flagName];
          }

          const { value } = resultObject;

          _.set(variationCacheResolved, key, value);

          return value;
        })
    );

    _.set(variationCache, key, variationPromise);
  }

  const flagValue = await variationPromise;

  return flagValue;
}

/**
 * @description
 * returns the currently cached value for for the
 * provided feature flag for the given organizationId or spaceId. If the flag name
 * is overridden using `ui_enable_flags`, then overridden value is returned.
 *
 * import { getVariationSync } from 'LaunchDarkly'
 * const variation = getVariationSync('my-test-or-feature-flag', { organizationId: '1234' })
 *
 * @return boolean
 */
export function getVariationSync(
  flagName: FLAGS,
  { organizationId, spaceId, environmentId }: GetVariationOptions = {}
) {
  if (isFlagOverridden(flagName)) {
    return getFlagOverride(flagName);
  }

  return (
    variationCacheResolved?.[getCacheKey(flagName, organizationId, spaceId, environmentId)] ??
    FALLBACK_VALUES[flagName]
  );
}

export function hasCachedVariation(
  flagName: FLAGS,
  organizationId?: string,
  spaceId?: string,
  environmentId?: string
) {
  const key = getCacheKey(flagName, organizationId, spaceId, environmentId);
  return variationCacheResolved?.[key] !== undefined;
}

interface FlagPromiseSuccess {
  success: true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: LDClient.LDFlagValue;
}

interface FlagPromiseFailure {
  success: false;
  message: string;
  data: {
    flagName: string;
    organizationId: string;
    spaceId: string;
    environmentId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variation?: LDClient.LDFlagValue;
  };
}

type FlagPromiseResult = FlagPromiseSuccess | FlagPromiseFailure;

/*
  Creates a promise that returns either the value of the flag in LaunchDarkly
  or undefined
 */
async function createFlagPromise(
  ldClient: LDClient.LDClient,
  flagName: FLAGS,
  { user, organizationId, spaceId, environmentId }
): Promise<FlagPromiseResult> {
  let org: Organization;
  let space: SpaceData;

  // Attempt to get the org and space, if given an ID.
  //
  // If the ID results in an unknown org or space, log the
  // error to Bugsnag and return undefined.
  try {
    org = organizationId ? await getOrganization(organizationId) : undefined;
  } catch (e) {
    return {
      success: false,
      message: 'Invalid org ID supplied to LD',
      data: {
        flagName,
        organizationId,
        spaceId,
        environmentId,
      },
    };
  }

  try {
    space = spaceId ? await getSpace(spaceId) : undefined;
  } catch (e) {
    return {
      success: false,
      message: 'Invalid space ID supplied to LD',
      data: {
        flagName,
        organizationId,
        spaceId,
        environmentId,
      },
    };
  }

  const currentUser = await ldUser({ user, org, space, environmentId });

  if (!isEqual(currentUser, cachedIdentifiedUser)) {
    try {
      await ldClient.identify(currentUser);

      cachedIdentifiedUser = currentUser;
    } catch (error) {
      return {
        success: false,
        message: error?.message ?? 'LaunchDarkly identify failed',
        data: {
          flagName,
          organizationId,
          spaceId,
          environmentId,
        },
      };
    }
  }

  const variation = ldClient.variation(flagName, MISSING_VARIATION_VALUE);

  if (variation === MISSING_VARIATION_VALUE) {
    return {
      success: false,
      message: 'Flag variation invalid or missing data',
      data: {
        flagName,
        organizationId,
        spaceId,
        environmentId,
      },
    };
  }

  if (typeof variation === 'string') {
    // The variation is JSON, so we parse and return it
    try {
      return {
        success: true,
        value: JSON.parse(variation),
      };
    } catch (e) {
      // Should never happen, but if the variation data could not be parsed
      // log the error and return undefined
      return {
        success: false,
        message: 'Invalid variation JSON',
        data: {
          flagName,
          variation,
          organizationId,
          spaceId,
          environmentId,
        },
      };
    }
  }

  // The variation is not JSON, so just pass as-is
  return {
    success: true,
    value: variation,
  };
}

export function ensureFlagsHaveFallback() {
  const flagNames = Object.values(FLAGS);
  const missing: string[] = [];

  for (const flagName of flagNames) {
    if (!(flagName in FALLBACK_VALUES)) {
      missing.push(flagName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Feature flag(s) are missing fallback values. Add fallback values for the following flag(s): ${missing.join(
        ', '
      )}`
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logAsyncError(asyncError: Error, message: string, extra: any = {}) {
  Object.assign(asyncError, {
    message,
  });

  captureError(asyncError, { extra });
}
