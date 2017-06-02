angular.module('contentful')
.directive('cfAccountOrganizationsNav', ['require', function (require) {
  return {
    template: require('account/OrganizationsNav').default(),
    restrict: 'E',
    scope: {},
    controller: 'organizationsNavController',
    controllerAs: 'nav'
  };
}])

.controller('organizationsNavController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var $q = require('$q');
  var $state = require('$state');
  var K = require('utils/kefir');
  var OrganizationList = require('OrganizationList');
  var tokenStore = require('tokenStore');

  init();

  K.onValueScope($scope, OrganizationList.organizations$, function (organizations) {
    controller.organizations = organizations;
  });

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

    $state.go(targetState, {orgId: selectedOrgId}, {inherit: false});
  };

  function init () {
    var orgId = $state.params.orgId;

    controller.selectedOrganizationId = orgId;
    controller.isNewOrgState = $state.current.name === 'account.organizations.new';

    if (controller.isNewOrgState) {
      controller.tabs = [{
        name: 'New Organization',
        state: 'account.organizations.new',
        params: '',
        selected: true,
        isActive: true
      }];
    } else {
      getOrganization(orgId).then(function (org) {
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
        return OrganizationList.get(orgId);
      });
    }
  }

  function makeTabs (org) {
    var orgId = _.get(org, 'sys.id');

    function applyDefaults (tabList) {
      return tabList.map(function (tab) {
        var params = _.assign({orgId: orgId}, tab.stateParams)
        return {
          name: tab.name,
          state: tab.state,
          testId: 'org-nav-tab-' + tab.name.toLowerCase().replace(/\s+/g, '-'),
          params: '(' + JSON.stringify(params) + ')',
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
        name: 'Billing',
        state: 'account.organizations.billing',
        isActive: isPaid(org) && OrganizationList.isOwnerOrAdmin(org)
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
        isActive: hasOffsiteBackup()
      }
    ]);
  }

  function isPaid (org) {
    return ['paid', 'free_paid']
      .indexOf(_.get(org, 'subscription.status')) >= 0;
  }

  function hasOffsiteBackup (org) {
    return _.get(
      org,
      'subscriptionPlan.limits.features.offsiteBackup',
      false
    );
  }
}]);
