import logger from 'logger';
import * as OrganizationRoles from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import * as K from 'utils/kefir';
import {get} from 'lodash';
import {createEndpoint as createOrgEndpoint} from 'access_control/OrganizationMembershipRepository';
import {getEnabledOrgFeatures} from 'account/pricing/PricingDataProvider';
import * as LD from 'utils/LaunchDarkly';

export function create ({space, organization}) {
  let features = [];
  const userQuota = {
    // TODO get from limits/usage endpoint
    limit: get(organization, 'subscriptionPlan.limits.permanent.organizationMembership', -1),
    used: get(organization, 'usage.permanent.organizationMembership', 1)
  };

  const orgEndpoint = organization ? createOrgEndpoint(organization.sys.id) : null;

  const isReadyBus = K.createPropertyBus(false);

  collectFeatures();

  return {
    isReady$: isReadyBus.property.skipDuplicates(),
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
    return isReadyBus.property.filter().toPromise()
      .then(() => get(features, name, false));
  }

  /**
   * @name accessChecker#canModifyRoles
   * @returns {boolean}
   * @description
   * Returns true if Roles can be modified.
   */
  function canModifyRoles () {
    if (!isSuperUser()) { return Promise.resolve(false); } else { return hasFeature('customRoles'); }
  }

  function collectFeatures () {
    features = [];
    isReadyBus.set(false);

    if (!organization) { return; }

    // Begin feature flag code - feature-bv-2018-01-features-api
    LD.getCurrentVariation('feature-bv-2018-01-features-api').then((flag) => {
      if (!flag) {
        // Get enabled features from token if feature flag is off
        features = get(organization, 'subscriptionPlan.limits.features', {});
        isReadyBus.set(true);
      } else {
        // Get enabled features from API if feature flag is on
        getEnabledOrgFeatures(orgEndpoint)
          .then((items) => {
            features = items.map((feature) => feature['internal_name']);
            isReadyBus.set(true);
          }).catch((err) => {
            logger.logError(`Could not fetch org features for ${organization.sys.id}`, err);
          });
      }
    });
    // End feature flag code - feature-bv-2018-01-features-api
  }
}
