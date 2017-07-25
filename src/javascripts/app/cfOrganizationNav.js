/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for organizations & billing views.
 */
 angular.module('contentful')
.directive('cfOrganizationNav', ['require', function (require) {
  var navBar = require('app/NavBar').default;
  var PAID_SUBSCRIPTION_STATUSES = ['paid', 'free_paid'];

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controllerAs: 'nav',
    controller: ['$scope', function ($scope) {
      var Navigator = require('states/Navigator');
      var modalDialog = require('modalDialog');
      var $stateParams = require('$stateParams');
      var tokenStore = require('services/TokenStore');
      var OrganizationRoles = require('services/OrganizationRoles');
      var K = require('utils/kefir');

      var nav = this;

      // Prevent unnecesary calls from watchers
      var onNavChange = _.debounce(updateNav, 50);

      // Update on state transition to another org
      $scope.$watch(function () { return $stateParams.orgId; }, onNavChange);

      // Update when token response is refreshed (e.g. billing tab should appear)
      K.onValueScope($scope, tokenStore.organizations$, onNavChange);

      function updateNav () {
        var orgId = nav.orgId = $stateParams.orgId;
        tokenStore.getOrganization(orgId).then(function (org) {
          nav.hasOffsiteBackup = hasOffsiteBackup(org);
          nav.hasBillingTab = isPaid(org) && OrganizationRoles.isOwnerOrAdmin(org);
        }, function () {
          modalDialog.openConfirmDialog({
            title: 'Organization not found',
            message: 'The organization you are looking for cannot be found. Click \'OK\' to go to homepage.'
          }).then(function () {
            Navigator.go({ path: ['home'] });
          });
        });
      }
    }]
  };

  function template () {
    return navBar([
      {
        title: 'Organization information',
        // TODO use cf-sref for navbar links
        sref: 'account.organizations.edit({orgId: nav.orgId})',
        rootSref: 'account.organizations.edit',
        icon: 'nav-organization-information'
      },
      {
        title: 'Subscription',
        sref: 'account.organizations.subscription({orgId: nav.orgId})',
        rootSref: 'account.organizations.subscription',
        icon: 'nav-organization-subscription'
      },
      {
        title: 'Billing',
        sref: 'account.organizations.billing({orgId: nav.orgId})',
        rootSref: 'account.organizations.billing',
        icon: 'nav-organization-billing',
        if: 'nav.hasBillingTab'
      },
      {
        title: 'Users',
        sref: 'account.organizations.users({orgId: nav.orgId})',
        rootSref: 'account.organizations.users',
        icon: 'nav-organization-billing'
      },
      {
        title: 'Spaces',
        sref: 'account.organizations.spaces({orgId: nav.orgId})',
        rootSref: 'account.organizations.spaces',
        icon: 'nav-spaces'
      },
      {
        title: 'Offsite backup',
        sref: 'account.organizations.offsitebackup({orgId: nav.orgId})',
        rootSref: 'account.organizations.offsitebackup',
        if: 'nav.hasOffsiteBackup'
      }
    ]);
  }

  function isPaid (org) {
    return PAID_SUBSCRIPTION_STATUSES.indexOf(org.subscription.status) >= 0;
  }

  function hasOffsiteBackup (org) {
    return _.get(org, 'subscriptionPlan.limits.features.offsiteBackup', false);
  }
}]);
