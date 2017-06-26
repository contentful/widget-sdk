/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for organizations & billing views.
 */
 angular.module('contentful')
.directive('cfOrganizationNav', ['require', function (require) {
  var navBar = require('app/NavBar').default;

  return {
    template: template(),
    restrict: 'E',
    controller: ['$scope', 'require', function ($scope, require) {
      var $state = require('$state');
      var tokenStore = require('services/TokenStore');
      var OrganizationRoles = require('services/OrganizationRoles');
      var orgId = $scope.orgId = $state.params.orgId;

      tokenStore.getOrganization(orgId).then(function (org) {
        $scope.hasOffsiteBackup = hasOffsiteBackup(org);
        $scope.hasBillingTab = isPaid(org) && OrganizationRoles.isOwnerOrAdmin(org);
      }, function () {
        $state.go('home');
      });
    }]
  };

  function template () {
    return navBar([
      {
        title: 'Settings',
        // TODO use cf-sref for navbar links
        sref: 'account.organizations.edit({orgId: orgId})'
      },
      {
        title: 'Subscription',
        sref: 'account.organizations.subscription({orgId: orgId})'
      },
      {
        title: 'Billing',
        sref: 'account.organizations.billing({orgId: orgId})',
        if: 'hasBillingTab'
      },
      {
        title: 'Users',
        sref: 'account.organizations.users({orgId: orgId})'
      },
      {
        title: 'Spaces',
        sref: 'account.organizations.spaces({orgId: orgId})'
      },
      {
        title: 'Offsite backup',
        sref: 'account.organizations.offsitebackup({orgId: orgId})',
        if: 'hasOffsiteBackup'
      }
    ]);
  }

  function isPaid (org) {
    return ['paid', 'free_paid']
      .indexOf(org.subscription.status) >= 0;
  }

  function hasOffsiteBackup (org) {
    return !!org.subscriptionPlan.limits.features.offsiteBackup;
  }
}]);
