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
  var $state = require('$state');
  var spaceContext = require('spaceContext');
  var OrganizationList = require('OrganizationList');
  var tokenStore = require('tokenStore');

  var canShowIntercomLink$ = tokenStore.user$.map(function (user) {
    var organizationMemberships = user && user.organizationMemberships || [];
    var canShowIntercomLink = _.find(organizationMemberships, function (membership) {
      var subscriptionStatus = _.get(membership, 'organization.subscription.status');
      return subscriptionStatus !== 'free';
    });
    return !!canShowIntercomLink;
  }).skipDuplicates();

  return {
    goToUserProfile: goToUserProfile,
    getSubscriptionState: getSubscriptionState,
    goToOrganizations: goToOrganizations,
    goToSubscription: goToSubscription,
    goToBilling: goToBilling,
    silentlyChangeState: silentlyChangeState,
    canGoToOrganizations: canGoToOrganizations,
    canShowIntercomLink$: canShowIntercomLink$
  };

  function goTo (pathSuffix, options) {
    return $state.go('account.pathSuffix', { pathSuffix: pathSuffix }, options);
  }

  /**
   * @ngdoc method
   * @name TheAccountView#goToUserProfile
   * @description
   * Navigates to the current user's user profile.
   */
  function goToUserProfile () {
    return goTo('profile/user', {reload: true});
  }

  /**
   * @ngdoc method
   * @name TheAccountView#getSubscriptionState
   * @description
   * Returns the state path for the account/subscription view if the user has
   * permission to access it otherwise returns undefined.
   */
  function getSubscriptionState () {
    var org = getGoToOrganizationsOrganization();
    if (org) {
      var pathSuffix = 'organizations/' + org.sys.id + '/z_subscription';
      return 'account.pathSuffix({ pathSuffix: \'' + pathSuffix + '\'})';
    }
  }

  /**
   * @ngdoc method
   * @name TheAccountView#goToSubscription
   * @description
   * `TheAccountView#goToOrganizations` shorthand to navigate to the current
   * organizatin's subscription page.
   */
  function goToSubscription () {
    return goToOrganizations('z_subscription');
  }

  /**
   * @ngdoc method
   * @name TheAccountView#goToBilling
   * @description
   * `TheAccountView#goToOrganizations` shorthand to navigate to the current
   * organizatin's billing page.
   */
  function goToBilling () {
    return goToOrganizations('z_billing');
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
    var org = getGoToOrganizationsOrganization();
    if (org) {
      // TODO: Support route in GK without `/z_subscription` part and remove it here.
      var subpageSuffix = subpage ? ('/' + subpage) : '/z_subscription';
      var pathSuffix = 'organizations/' + org.sys.id + subpageSuffix;
      return goTo(pathSuffix, {reload: true});
    } else {
      return $q.reject();
    }
  }

  /**
   * @ngdoc method
   * @name TheAccountView#canGoToOrganizations
   * @returns {boolean}
   * @description
   *
   * Returns whether the current user can actually navigate to the organizations
   * settings view.
   */
  function canGoToOrganizations () {
    return !!getGoToOrganizationsOrganization();
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
    var orgs = [spaceContext.organizationContext.organization];
    if (!orgs[0]) {
      // No space yet, get next best organization.
      orgs = OrganizationList.getAll();
    }
    return findOwnedOrgWithState(orgs, 'trial') ||
      findOwnedOrgWithState(orgs, 'active') ||
      findOwnedOrgWithState(orgs, '*') ||
      null;
  }

  /**
   * @ngdoc method
   * @name TheAccountView#silentlyChangeState
   * @description
   * Changes URL, without any other side effects.
   */
  function silentlyChangeState (pathSuffix) {
    if (pathSuffix) {
      return goTo(pathSuffix, {location: 'replace'});
    } else {
      return $q.reject();
    }
  }

  function findOwnedOrgWithState (orgs, state) {
    return _.find(orgs, filter);

    function filter (organization) {
      return OrganizationList.isOwnerOrAdmin(organization) &&
        (organization.subscriptionState === state || state === '*');
    }
  }
}]);
