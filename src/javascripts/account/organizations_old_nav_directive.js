angular.module('contentful')
.directive('cfOrganizationsOldNav', ['require', function (require) {
  return {
    template: require('account/OrganizationsOldNav').default(),
    restrict: 'E',
    scope: {},
    controller: 'organizationsNavController',
    controllerAs: 'nav'
  };
}])

.controller('organizationsNavController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var $state = require('$state');
  var K = require('utils/kefir');
  var OrganizationRoles = require('services/OrganizationRoles');
  var tokenStore = require('services/TokenStore');

  controller.goToOrganization = goToOrganization;
  controller.isTabSelected = isTabSelected;

  K.onValueScope($scope, tokenStore.organizations$, function (organizations) {
    updateNav(organizations, $state.params.orgId);
  });

  function updateNav (organizations, selectedOrgId) {
    controller.selectedOrganizationId = selectedOrgId;
    controller.organizations = organizations;

    tokenStore.getOrganization(selectedOrgId).then(function (org) {
      controller.tabs = makeTabs(org);
    }, handleInvalidOrganization);
  }

  // Go to the corresponding page in the other organization or the defualt
  // `subscription` page if it's not available
  function goToOrganization (selectedOrgId) {
    var defaultState = 'account.organizations.subscription';

    tokenStore.getOrganization(selectedOrgId).then(function (targetOrg) {
      var hasCurrentStateRef = _.find(makeTabs(targetOrg), function (tab) {
        return isTabSelected(tab);
      });

      var targetState = hasCurrentStateRef ? $state.current : defaultState;

      $state.go(targetState, { orgId: selectedOrgId }, { inherit: false });
    }, handleInvalidOrganization);
  }

  function isTabSelected (tab) {
    return $state.current.name === tab.state.path.join('.');
  }

  function handleInvalidOrganization () {
    $state.go('home');
  }

  function makeTabs (org) {
    return tabs.filter(function (tab) {
      return !(tab.isHidden && tab.isHidden(org));
    })
    .map(function (tab) {
      return {
        name: tab.name,
        testId: 'org-nav-tab-' + tab.name.toLowerCase().replace(/\s+/g, '-'),
        state: { path: tab.path, params: { orgId: org.sys.id } }
      };
    });
  }

  var tabs = [
    {
      name: 'Settings',
      path: ['account', 'organizations', 'edit']
    },
    {
      name: 'Subscription',
      path: ['account', 'organizations', 'subscription']
    },
    {
      name: 'Billing',
      path: ['account', 'organizations', 'billing'],
      isHidden: function (org) {
        return !(isPaid(org) && OrganizationRoles.isOwnerOrAdmin(org));
      }
    },
    {
      name: 'Users',
      path: ['account', 'organizations', 'users']
    },
    {
      name: 'Spaces',
      path: ['account', 'organizations', 'spaces']
    },
    {
      name: 'Offsite backup',
      path: ['account', 'organizations', 'offsitebackup'],
      isHidden: function (org) {
        return !hasOffsiteBackup(org);
      }
    }
  ];

  function isPaid (org) {
    return ['paid', 'free_paid']
      .indexOf(org.subscription.status) >= 0;
  }

  function hasOffsiteBackup (org) {
    return !!org.subscriptionPlan.limits.features.offsiteBackup;
  }
}]);
