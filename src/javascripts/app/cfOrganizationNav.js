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
    scope: {},
    controllerAs: 'nav',
    controller: function () {
      var Navigator = require('states/Navigator');
      var $stateParams = require('$stateParams');
      var tokenStore = require('services/TokenStore');
      var OrganizationRoles = require('services/OrganizationRoles');

      var nav = this;
      var orgId = nav.orgId = $stateParams.orgId;

      tokenStore.getOrganization(orgId).then(function (org) {
        nav.hasOffsiteBackup = hasOffsiteBackup(org);
        nav.hasBillingTab = isPaid(org) && OrganizationRoles.isOwnerOrAdmin(org);
      }, function () {
        Navigator.go({ path: ['home'] });
      });
    }
  };

  function template () {
    return navBar([
      {
        title: 'Organization information',
        // TODO use cf-sref for navbar links
        sref: 'account.organizations.edit({orgId: nav.orgId})',
        icon: 'nav-organization-information'
      },
      {
        title: 'Subscription',
        sref: 'account.organizations.subscription({orgId: nav.orgId})',
        icon: 'nav-organization-subscription'
      },
      {
        title: 'Billing',
        sref: 'account.organizations.billing({orgId: nav.orgId})',
        icon: 'nav-organization-billing',
        if: 'nav.hasBillingTab'
      },
      {
        title: 'Users',
        sref: 'account.organizations.users({orgId: nav.orgId})',
        icon: 'nav-organization-billing'
      },
      {
        title: 'Spaces',
        sref: 'account.organizations.spaces({orgId: nav.orgId})',
        icon: 'nav-spaces'
      },
      {
        title: 'Offsite backup',
        sref: 'account.organizations.offsitebackup({orgId: nav.orgId})',
        if: 'nav.hasOffsiteBackup'
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
