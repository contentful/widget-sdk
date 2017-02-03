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

  return {
    getSubscriptionState: getSubscriptionState,
    goToOrganizations: goToOrganizations,
    goToSubscription: goToSubscription,
    goToBilling: goToBilling,
    canGoToOrganizations: canGoToOrganizations,
    getGoToOrganizationsOrganization: getGoToOrganizationsOrganization
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
    if (org) {
      return 'account.organizations.subscription({ orgId: \'' + org.sys.id + '\' })';
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
    return this.goToOrganizations('subscription');
  }

  /**
   * @ngdoc method
   * @name TheAccountView#goToBilling
   * @description
   * `TheAccountView#goToOrganizations` shorthand to navigate to the current
   * organization's billing page.
   */
  function goToBilling () {
    return this.goToOrganizations('billing');
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
      subpage = subpage || 'subscription';
      return $state.go('account.organizations.' + subpage, {orgId: org.sys.id}, {reload: true});
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
    var orgs = [spaceContext.getData('organization')];
    if (!orgs[0]) {
      // No space yet, get next best organization.
      orgs = OrganizationList.getAll();
    }
    return findOwnedOrgWithState(orgs, 'trial') ||
      findOwnedOrgWithState(orgs, 'active') ||
      findOwnedOrgWithState(orgs, '*') ||
      null;
  }

  function findOwnedOrgWithState (orgs, state) {
    return _.find(orgs, filter);

    function filter (organization) {
      return OrganizationList.isOwnerOrAdmin(organization) &&
        (organization.subscriptionState === state || state === '*');
    }
  }
}]);
