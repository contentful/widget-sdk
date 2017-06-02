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

    var hasCurrentStateRef = _.find(makeTabs(targetOrg), function (tab) {
      return tab.state.path.join('.') === $state.current.name;
    });

    var targetState = hasCurrentStateRef ? $state.current : defaultState;

    $state.go(targetState, {orgId: selectedOrgId}, {inherit: false});
  };

  function init () {
    var orgId = $state.params.orgId;

    controller.selectedOrganizationId = orgId;
    controller.isNewOrgState = $state.current.name === 'account.organizations.new';

    if (controller.isNewOrgState) {
      controller.tabs = [{
        name: 'New Organization',
        state: { path: ['account', 'organizations', 'new'] },
        selected: true
      }];
    } else {
      getOrganization(orgId).then(function (org) {
        if (org) {
          controller.tabs = makeTabs(org);
        } else {
          // Redirect to home since the organization is invalid
          $state.go('home');
        }
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
      }).catch(function () {
        return null;
      });
    }
  }

  function makeTabs (org) {
    return applyDefaults([
      {
        name: 'Settings',
        state: { path: ['account', 'organizations', 'edit'] }
      },
      {
        name: 'Subscription',
        state: { path: ['account', 'organizations', 'subscription'] }
      },
      {
        name: 'Billing',
        state: { path: ['account', 'organizations', 'billing'] },
        isHidden: !(isPaid(org) && OrganizationList.isOwnerOrAdmin(org))
      },
      {
        name: 'Users',
        state: { path: ['account', 'organizations', 'users'] }
      },
      {
        name: 'Spaces',
        state: { path: ['account', 'organizations', 'spaces'] }
      },
      {
        name: 'Offsite backup',
        state: { path: ['account', 'organizations', 'offsitebackup'] },
        isHidden: !hasOffsiteBackup(org)
      }
    ]);

    function applyDefaults (tabList) {
      return tabList.filter(function (tab) {
        return !tab.isHidden;
      }).map(function (tab) {
        var state = { path: tab.state.path, params: { orgId: org.sys.id } };
        return {
          name: tab.name,
          state: state,
          testId: 'org-nav-tab-' + tab.name.toLowerCase().replace(/\s+/g, '-'),
          selected: $state.current.name === tab.state.path.join('.')
        };
      });
    }
  }

  function isPaid (org) {
    return ['paid', 'free_paid']
      .indexOf(org.subscription.status) >= 0;
  }

  function hasOffsiteBackup (org) {
    return !!org.subscriptionPlan.limits.features.offsiteBackup;
  }
}]);
