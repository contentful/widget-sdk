import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import navBar from 'navigation/templates/NavBar.es6';
import { isOwner } from 'services/OrganizationRoles.es6';

/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for organizations & billing views.
 */
registerDirective('cfOrganizationNav', () => {
  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controllerAs: 'nav',
    controller: [
      '$scope',
      '$stateParams',
      'services/TokenStore.es6',
      'utils/LaunchDarkly/index.es6',
      'services/FeatureService.es6',
      function($scope, $stateParams, TokenStore, LD, { default: createFeatureService }) {
        const nav = this;

        // Prevent unnecesary calls from watchers
        const onNavChange = _.debounce(updateNav, 50);

        // Update on state transition to another org
        $scope.$watch(() => $stateParams.orgId, onNavChange);

        // Update when token response is refreshed (e.g. billing tab should appear)
        K.onValueScope($scope, TokenStore.organizations$, onNavChange);

        // Set feature flag for Teams
        LD.getCurrentVariation('feature-bv-11-2018-teams').then(function(variation) {
          nav.teamsEnabled = variation;
        });

        function updateNav() {
          const orgId = (nav.orgId = $stateParams.orgId);
          TokenStore.getOrganization(orgId).then(org => {
            const FeatureService = createFeatureService(orgId, 'organization');

            nav.pricingVersion = org.pricingVersion;

            FeatureService.get('offsiteBackup').then(featureEnabled => {
              nav.hasOffsiteBackup = featureEnabled;
            });
            nav.hasBillingTab = org.isBillable && isOwner(org);
            nav.hasSettingsTab = isOwner(org);
          });
        }
      }
    ]
  };

  function template() {
    return navBar([
      {
        title: 'Organization information',
        // TODO use cf-sref for navbar links
        sref: 'account.organizations.edit({orgId: nav.orgId})',
        rootSref: 'account.organizations.edit',
        inheritUrlParams: false,
        icon: 'nav-organization-information',
        dataViewType: 'organization-information',
        if: 'nav.hasSettingsTab'
      },
      {
        if: 'nav.pricingVersion == "pricing_version_1"',
        title: 'Subscription',
        sref: 'account.organizations.subscription({orgId: nav.orgId})',
        rootSref: 'account.organizations.subscription',
        inheritUrlParams: false,
        icon: 'nav-organization-subscription',
        dataViewType: 'subscription'
      },
      {
        if: 'nav.pricingVersion == "pricing_version_2"',
        title: 'Subscription',
        sref: 'account.organizations.subscription_new({orgId: nav.orgId})',
        rootSref: 'account.organizations.subscription_new',
        inheritUrlParams: false,
        icon: 'nav-organization-subscription',
        dataViewType: 'subscription-new'
      },
      {
        title: 'Billing',
        sref: 'account.organizations.billing({orgId: nav.orgId})',
        rootSref: 'account.organizations.billing',
        inheritUrlParams: false,
        icon: 'nav-organization-billing',
        dataViewType: 'billing',
        if: 'nav.hasBillingTab'
      },
      {
        if: 'nav.pricingVersion == "pricing_version_2"',
        title: 'Usage',
        sref: 'account.organizations.usage({orgId: nav.orgId})',
        rootSref: 'account.organizations.usage',
        inheritUrlParams: false,
        icon: 'nav-usage',
        dataViewType: 'platform-usage'
      },
      {
        title: 'Users',
        sref: 'account.organizations.users.list({orgId: nav.orgId})',
        rootSref: 'account.organizations.users',
        inheritUrlParams: false,
        icon: 'nav-organization-users',
        dataViewType: 'organization-users'
      },
      {
        if: 'nav.pricingVersion === "pricing_version_2" && nav.teamsEnabled',
        title: 'Teams',
        sref: 'account.organizations.teams({orgId: nav.orgId})',
        rootSref: 'account.organizations.teams',
        inheritUrlParams: false,
        icon: 'nav-organization-users',
        dataViewType: 'organization-teams'
      },
      {
        if: 'nav.pricingVersion == "pricing_version_1"',
        title: 'Spaces',
        sref: 'account.organizations.spaces({orgId: nav.orgId})',
        rootSref: 'account.organizations.spaces',
        inheritUrlParams: false,
        icon: 'nav-spaces',
        dataViewType: 'organization-spaces'
      },
      {
        title: 'Offsite backup',
        sref: 'account.organizations.offsitebackup({orgId: nav.orgId})',
        rootSref: 'account.organizations.offsitebackup',
        inheritUrlParams: false,
        dataViewType: 'offsite-backup',
        if: 'nav.hasOffsiteBackup'
      }
    ]);
  }
});
