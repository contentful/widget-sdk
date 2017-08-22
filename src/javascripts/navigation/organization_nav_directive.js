/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for organizations & billing views.
 */
 angular.module('contentful')
.directive('cfOrganizationNav', ['require', function (require) {
  var navBar = require('navigation/templates/NavBar').default;

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controllerAs: 'nav',
    controller: ['$scope', function ($scope) {
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
          nav.hasBillingTab = org.isBillable && OrganizationRoles.isOwner(org);
          nav.hasSettingsTab = OrganizationRoles.isOwner(org);
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
        icon: 'nav-organization-information',
        dataViewType: 'organization-information',
        if: 'nav.hasSettingsTab'
      },
      {
        title: 'Subscription',
        sref: 'account.organizations.subscription({orgId: nav.orgId})',
        rootSref: 'account.organizations.subscription',
        icon: 'nav-organization-subscription',
        dataViewType: 'subscription'
      },
      {
        title: 'Billing',
        sref: 'account.organizations.billing({orgId: nav.orgId})',
        rootSref: 'account.organizations.billing',
        icon: 'nav-organization-billing',
        dataViewType: 'billing',
        if: 'nav.hasBillingTab'
      },
      {
        title: 'Users',
        sref: 'account.organizations.users({orgId: nav.orgId})',
        rootSref: 'account.organizations.users',
        icon: 'nav-organization-users',
        dataViewType: 'organization-users'
      },
      {
        title: 'Spaces',
        sref: 'account.organizations.spaces({orgId: nav.orgId})',
        rootSref: 'account.organizations.spaces',
        icon: 'nav-spaces',
        dataViewType: 'organization-spaces'
      },
      {
        title: 'Offsite backup',
        sref: 'account.organizations.offsitebackup({orgId: nav.orgId})',
        rootSref: 'account.organizations.offsitebackup',
        dataViewType: 'offsite-backup',
        if: 'nav.hasOffsiteBackup'
      }
    ]);
  }

  function hasOffsiteBackup (org) {
    return _.get(org, 'subscriptionPlan.limits.features.offsiteBackup', false);
  }
}]);
