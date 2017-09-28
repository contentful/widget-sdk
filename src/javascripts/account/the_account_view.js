'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @module contentful
 * @name TheAccountView
 * @description
 * This service exposes some helper methods for
 * account section URL manipulation.
 */
.factory('TheAccountView', ['require', function (require) {
  var $q = require('$q');
  var spaceContext = require('spaceContext');
  var OrganizationRoles = require('services/OrganizationRoles');
  var TokenStore = require('services/TokenStore');
  var K = require('utils/kefir');
  var Navigator = require('states/Navigator');

  var canShowIntercomLink$ = TokenStore.user$.map(function (user) {
    var organizationMemberships = user && user.organizationMemberships || [];
    var canShowIntercomLink = _.find(organizationMemberships, function (membership) {
      var subscriptionStatus = _.get(membership, 'organization.subscription.status');
      return subscriptionStatus !== 'free';
    });
    return !!canShowIntercomLink;
  }).skipDuplicates();

  return {
    getSubscriptionState: getSubscriptionState,
    getOrganizationRef: getOrganizationRef,
    goToSubscription: goToSubscription,
    goToUsers: goToUsers,
    canShowIntercomLink$: canShowIntercomLink$
  };

  /**
   * @ngdoc method
   * @name TheAccountView#getSubscriptionState
   * @description
   * Returns the state path for the account/subscription view if the user has
   * permission to access it otherwise returns undefined.
   */
  function getSubscriptionState () {
    var org = getGoToOrganizationsOrganization();
    // TODO use a navigator reference
    if (org) {
      return 'account.organizations.subscription({ orgId: \'' + org.sys.id + '\' })';
    }
  }

  /**
   * @ngdoc method
   * @name TheAccountView#goToSubscription
   * @description
   * `TheAccountView#goToOrganizations` shorthand to navigate to the current
   * organization's subscription page.
   */
  function goToSubscription () {
    return goToOrganizations('subscription');
  }

  /**
   * @ngdoc method
   * @name TheAccountView#goToUsers
   * @description
   * `TheAccountView#goToOrganizations` shorthand to navigate to the current
   * organization's users (memberships) page.
   */
  function goToUsers () {
    return goToOrganizations('users.gatekeeper');
  }

  /**
   * @ngdoc method
   * @name TheAccountView#goToOrganizations
   * @description
   * Navigates to the “Organizations & billing” page of the current organization
   * or - if the user hasn't got any space yet - for the the user's next best
   * organization. Only organization owners and admins get navigated.
   */
  function goToOrganizations (subpage) {
    var ref = getOrganizationRef(subpage);
    if (ref) {
      return Navigator.go(ref);
    } else {
      return $q.reject();
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
  function getOrganizationRef (subpage) {
    var org = getGoToOrganizationsOrganization();
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
  function getGoToOrganizationsOrganization () {
    var orgs = [spaceContext.getData('organization')];
    if (!orgs[0]) {
      // No space yet, get next best organization.
      orgs = K.getValue(TokenStore.organizations$);
    }
    return findOwnedOrgWithState(orgs, 'trial') ||
      findOwnedOrgWithState(orgs, 'active') ||
      findOwnedOrgWithState(orgs, '*') ||
      null;
  }

  function findOwnedOrgWithState (orgs, state) {
    return _.find(orgs, filter);

    function filter (organization) {
      return OrganizationRoles.isOwnerOrAdmin(organization) &&
        (organization.subscriptionState === state || state === '*');
    }
  }
}]);
