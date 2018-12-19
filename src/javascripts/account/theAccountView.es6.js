import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import * as Navigator from 'states/Navigator.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';

/**
 * @ngdoc service
 * @module contentful
 * @name TheAccountView
 * @description
 * This service exposes some helper methods for
 * account section URL manipulation.
 */
registerFactory('TheAccountView', [
  '$q',
  'spaceContext',
  'services/TokenStore.es6',
  'utils/ResourceUtils.es6',
  ($q, spaceContext, TokenStore, ResourceUtils) => {
    const { isLegacyOrganization } = ResourceUtils;

    return {
      getSubscriptionState: getSubscriptionState,
      getOrganizationRef: getOrganizationRef,
      goToSubscription: goToSubscription,
      goToUsers: goToUsers
    };

    /**
     * @ngdoc method
     * @name TheAccountView#getSubscriptionState
     * @description
     * Returns the state object for the current space's org account/subscription
     * view if the user has permission to access it otherwise returns null.
     */
    function getSubscriptionState() {
      const org = spaceContext.getData('organization');
      if (!org || !isOwnerOrAdmin(org)) {
        return null;
      } else if (isLegacyOrganization(org)) {
        return getOrganizationRef('subscription');
      } else {
        return getOrganizationRef('subscription_new');
      }
    }

    /**
     * @ngdoc method
     * @name TheAccountView#goToSubscription
     * @description
     * `TheAccountView#goToOrganizations` shorthand to navigate to the current
     * organization's subscription page.
     */
    function goToSubscription() {
      const org = getGoToOrganizationsOrganization();
      if (!org) {
        return $q.reject('Cannot go to subscription - no suitable organization');
      } else if (isLegacyOrganization(org)) {
        return goToOrganizations('subscription');
      } else {
        return goToOrganizations('subscription_new');
      }
    }

    /**
     * @ngdoc method
     * @name TheAccountView#goToUsers
     * @description
     * `TheAccountView#goToOrganizations` shorthand to navigate to the current
     * organization's users (memberships) page.
     */
    function goToUsers() {
      return goToOrganizations('users.list');
    }

    /**
     * @ngdoc method
     * @name TheAccountView#goToOrganizations
     * @description
     * Navigates to the “Organizations & billing” page of the current organization
     * or - if the user hasn't got any space yet - for the the user's next best
     * organization. Only organization owners and admins get navigated.
     */
    function goToOrganizations(subpage) {
      const ref = getOrganizationRef(subpage);
      if (ref) {
        return Navigator.go(ref);
      } else {
        return $q.reject(new Error('Cannot go to organization page: ' + subpage));
      }
    }

    /**
     * @ngdoc method
     * @name TheAccountView#getOrganizationRef
     * @description
     * Returns a state reference for the current users current
     * organization management view. The current organization is
     * determined by `getGoToOrganizationsOrganization()`.
     *
     * The state reference can by used by the `states/Navigator` module
     * or the `cfSref` directive.
     *
     * @param {string?} subpage
     *   The subpage in the organization view
     * @returns {Navigator.Ref}
     */
    function getOrganizationRef(subpage) {
      const org = getGoToOrganizationsOrganization();
      if (org) {
        subpage = subpage || 'subscription';
        return {
          path: ['account', 'organizations', subpage],
          params: {
            orgId: org.sys.id
          },
          options: { reload: true }
        };
      } else {
        return null;
      }
    }

    /**
     * @ngdoc method
     * @name TheAccountView#getGoToOrganizationsOrganization
     * @returns {API.Organization?}
     * @description
     * Returns the current space's organization if it is owned by the user or - if the
     * user hasn't got any space yet - the next best current user owned organization.
     */
    function getGoToOrganizationsOrganization() {
      let orgs = [spaceContext.getData('organization')];
      if (!orgs[0]) {
        // No space yet, get next best organization.
        orgs = K.getValue(TokenStore.organizations$);
      }
      return (
        findOwnedOrgWithState(orgs, 'trial') ||
        findOwnedOrgWithState(orgs, 'active') ||
        findOwnedOrgWithState(orgs, '*') ||
        null
      );
    }

    function findOwnedOrgWithState(orgs, state) {
      return _.find(orgs, filter);

      function filter(organization) {
        return (
          isOwnerOrAdmin(organization) &&
          (organization.subscriptionState === state || state === '*')
        );
      }
    }
  }
]);
