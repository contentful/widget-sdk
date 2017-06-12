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
  var OrganizationList = require('services/OrganizationList');
  var tokenStore = require('tokenStore');

  var orgId = $state.params.orgId;
  controller.selectedOrganizationId = orgId;
  controller.goToOrganization = goToOrganization;
  controller.isTabSelected = isTabSelected;

  K.onValueScope($scope, tokenStore.organizations$, function (organizations) {
    controller.organizations = organizations;
  });

  getOrganization(orgId).then(function (org) {
    if (org) {
      controller.tabs = makeTabs(org);
    } else {
      // Redirect to home since the organization is invalid
      $state.go('home');
    }
  });

  // Go to the corresponding page in the other organization or the defualt
  // `subscription` page if it's not available
  function goToOrganization (selectedOrgId) {
    var targetOrg = controller.organizations.find({ sys: { id: selectedOrgId } });

    var defaultState = 'account.organizations.subscription';

    var hasCurrentStateRef = _.find(makeTabs(targetOrg), function (tab) {
      return isTabSelected(tab);
    });

    var targetState = hasCurrentStateRef ? $state.current : defaultState;

    $state.go(targetState, { orgId: selectedOrgId }, { inherit: false });
  }

  function isTabSelected (tab) {
    return $state.current.name === tab.state.path.join('.');
  }

  // Get the requested organization. Try to refresh the user token if the
  // requested org is not on the list as the list may not be up to date.
  function getOrganization (orgId) {
    var org = _.find(controller.organizations, { sys: { id: orgId } });
    if (org) {
      return $q.resolve(org);
    } else {
      return tokenStore.refresh().then(function () {
        return tokenStore.getOrganization(orgId);
      }).catch(function () {
        return null;
      });
    }
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
        return !(isPaid(org) && OrganizationList.isOwnerOrAdmin(org));
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
