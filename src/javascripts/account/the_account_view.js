'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @module contentful
 * @name TheAccountView
 * @description
 * This service holds the current state of the GK "account" section
 * and exposes some helper methods for URL manipulation.
 */
.factory('TheAccountView', ['$injector', function ($injector) {

  var $q = $injector.get('$q');
  var $state = $injector.get('$state');
  var spaceContext = $injector.get('spaceContext');
  var OrganizationList = $injector.get('OrganizationList');

  var isActive = false;

  return {
    goToUserProfile: goToUserProfile,
    goToSubscription: goToSubscription,
    silentlyChangeState: silentlyChangeState,
    getGoToSubscriptionOrganization: getGoToSubscriptionOrganization,

    /**
     * @ngdoc method
     * @name TheAccountView#enter
     * @description
     * Marks the "account" section as active.
     */
    enter: function () { isActive = true; },
    /**
     * @ngdoc method
     * @name TheAccountView#exit
     * @description
     * Marks the "account" section as inactive.
     */
    exit: function () { isActive = false; },
    /**
     * @ngdoc method
     * @name TheAccountView#isActive
     * @description
     * Checks if the "account" section is active.
     */
    isActive: function () { return isActive; }
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
   * @name TheAccountView#goToSubscription
   * @description
   * Navigates to the subscription details page for the current space or - if the
   * user hasn't got any space yet - for the the user's next best organization.
   * Only organization owners get navigated.
   */
  function goToSubscription () {
    var org = getGoToSubscriptionOrganization();
    if (org) {
      var pathSuffix = 'organizations/' + org.sys.id + '/subscription';
      return goTo(pathSuffix, {reload: true});
    } else {
      return $q.reject();
    }
  }

  /**
   * @ngdoc method
   * @name TheAccountView#getGoToSubscriptionOrganization
   * @returns {API.Organization?}
   * @description
   * Returns the current space's organization if it is owned by the user or - if the
   * user hasn't got any space yet - the next best current user owned organization.
   */
  function getGoToSubscriptionOrganization () {
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
      var organizationId = dotty.get(organization, 'sys.id');
      return organizationId &&
        OrganizationList.isOwnerOrAdmin(organizationId) &&
        (organization.subscriptionState === state || state === '*');
    }
  }
}]);
