import logger from 'logger';
import * as OrganizationRoles from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import {get, camelCase} from 'lodash';
import {createEndpoint as createOrgEndpoint} from 'access_control/OrganizationMembershipRepository';
import {getEnabledOrgFeatures} from 'account/pricing/PricingDataProvider';
// TODO prevent circular ref
import require from 'require';

export function create ({space, organization}) {
  let features;
  const userQuota = {
    // TODO get from limits/usage endpoint
    limit: get(organization, 'subscriptionPlan.limits.permanent.organizationMembership', -1),
    used: get(organization, 'usage.permanent.organizationMembership', 1)
  };

  return {
    getUserQuota: () => userQuota,
    /**
     * @name accessChecker#canModifyUsers
     * @returns {boolean}
     * @description
     * Returns true if Users can be modified.
     */
    canModifyUsers: () => isSuperUser(),
    hasFeature,
    canModifyRoles,
    canCreateOrganization,
    isSuperUser
  };

  /**
   * @name accessChecker#canCreateOrganization
   * @returns {boolean}
   * @description
   * Returns true if current user can create a new organization.
   */
  function canCreateOrganization () {
    return get(K.getValue(TokenStore.user$), 'canCreateOrganization', false);
  }

  function isSuperUser () {
    const isSpaceAdmin = get(space, 'spaceMembership.admin');
    const isOrganizationAdmin = OrganizationRoles.isAdmin(organization);
    const isOrganizationOwner = OrganizationRoles.isOwner(organization);
    return isSpaceAdmin || isOrganizationAdmin || isOrganizationOwner;
  }

  function hasFeature (name) {
    return collectFeatures().then((features) => get(features, name, false));
  }

  /**
   * @name accessChecker#canModifyRoles
   * @returns {boolean}
   * @description
   * Returns true if Roles can be modified.
   */
  function canModifyRoles () {
    if (!isSuperUser()) {
      return Promise.resolve(false);
    } else {
      return hasFeature('customRoles');
    }
  }

  function collectFeatures () {
    if (features) {
      return Promise.resolve(features);
    } else {
      return loadOrgFeatures(organization).then((f) => { features = f; return features; });
    }
  }
}

function loadOrgFeatures (organization) {
  if (!organization) {
    return Promise.resolve([]);
  }

  // Begin feature flag code - feature-bv-2018-01-features-api
  return require('utils/LaunchDarkly').getCurrentVariation('feature-bv-2018-01-features-api').then((useFeaturesApi) => {
    if (useFeaturesApi || organization.pricingVersion === 'pricing_version_2') {
      // Get enabled features from API if feature flag is on, or if token
      // doesn't have features because of new pricing version.
      const orgEndpoint = createOrgEndpoint(organization.sys.id);
      return getEnabledOrgFeatures(orgEndpoint)
        .then((items) => items.map((feature) => camelCase(feature['internal_name'])))
        .catch((err) => {
          logger.logError(`Could not fetch org features for ${organization.sys.id}`, err);
          return [];
        });
    } else {
      // Get enabled features from token if feature flag is off
      const features = get(organization, 'subscriptionPlan.limits.features', {});
      return Promise.resolve(features);
    }
  });
  // End feature flag code - feature-bv-2018-01-features-api
}
