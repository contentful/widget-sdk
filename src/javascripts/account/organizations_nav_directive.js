angular.module('contentful')
.directive('cfAccountOrganizationsNav', function () {
  return {
    template: JST['organizations_nav'](),
    restrict: 'E',
    scope: {},
    controller: 'organizationsNavController',
    controllerAs: 'nav'
  };
})

.controller('organizationsNavController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var $q = require('$q');
  var $state = require('$state');
  var K = require('utils/kefir');
  var OrganizationList = require('OrganizationList');
  var tokenStore = require('tokenStore');

  controller.isNewOrgState = $state.current.name === 'account.organizations.new';

  K.onValueScope($scope, OrganizationList.organizations$, initOrganizations);

  // Go to the corresponding page in the other organization or the defualt
  // `subscription` page if it's not available
  controller.goToOrganization = function (selectedOrgId) {
    var targetOrg = OrganizationList.get(selectedOrgId);

    var defaultState = 'account.organizations.subscription';

    var canSwitchOrgInCurrentState = !controller.isNewOrgState && _.get(
      _.find(makeTabs(targetOrg), ['state', $state.current.name]),
      'isActive'
    );

    var targetState = canSwitchOrgInCurrentState ? $state.current : defaultState;

    $state.go(targetState, {orgId: selectedOrgId});
  };

  function initOrganizations (organizations) {
    var requestedOrgId = $state.params.orgId;

    controller.organizations = organizations;
    controller.selectedOrganizationId = requestedOrgId;

    if (!controller.isNewOrgState) {
      getOrganization(requestedOrgId).then(function (org) {
        controller.tabs = _.map(makeTabs(org), function (tab) {
          tab.selected = $state.current.name === tab.state;
          return tab;
        });
      }).catch(function () {
        // Redirect to home since the organization is invalid
        $state.go('home');
      });
    }
  }

  // Get the requested organization. Try to refresh the user token if the
  // requested org is not on the list as the list may not be up to date.
  function getOrganization (orgId) {
    var org = OrganizationList.get(orgId);
    if (org) {
      return $q.resolve(org);
    } else {
      return tokenStore.refresh().then(function () {
        org = OrganizationList.get(orgId);
        return org ? $q.resolve(org) : $q.reject();
      });
    }
  }

  function makeTabs (org) {
    var orgId = _.get(org, 'sys.id');

    function applyDefaults (tabList) {
      return tabList.map(function (tab) {
        return {
          name: tab.name,
          state: tab.state,
          params: '(' + JSON.stringify(_.assign({orgId: orgId}, tab.stateParams)) + ')',
          isActive: _.defaultTo(tab.isActive, true)
        };
      });
    }

    return applyDefaults([
      {
        name: 'Settings',
        state: 'account.organizations.edit'
      },
      {
        name: 'Subscription',
        state: 'account.organizations.subscription'
      },
      {
        name: 'Users',
        state: 'account.organizations.users'
      },
      {
        name: 'Spaces',
        state: 'account.organizations.spaces'
      },
      {
        name: 'Offsite backup',
        state: 'account.organizations.offsitebackup',
        stateParams: {pathSuffix: '/edit'},
        isActive: _.get(
          org,
          'subscriptionPlan.limits.features.offsiteBackup',
          false
        )
      }
    ]);
  }
}]);
