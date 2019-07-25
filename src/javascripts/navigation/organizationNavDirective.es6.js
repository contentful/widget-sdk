import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import navBar from 'navigation/templates/NavBar.es6';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { SSO_SELF_CONFIG_FLAG } from 'featureFlags.es6';
import { getOrgFeature } from '../data/CMA/ProductCatalog.es6';
import createLegacyFeatureService from 'services/LegacyFeatureService.es6';

import { getVariation } from 'LaunchDarkly.es6';

export default function register() {
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
        function($scope, $stateParams) {
          const nav = this;

          // Prevent unnecessary calls from watchers
          const onNavChange = _.debounce(updateNav, 50);

          // Update on state transition to another org
          $scope.$watch(() => $stateParams.orgId, onNavChange);

          // Update when token response is refreshed (e.g. billing tab should appear)
          K.onValueScope($scope, TokenStore.organizations$, onNavChange);

          async function updateNav() {
            const orgId = (nav.orgId = $stateParams.orgId);

            Promise.all([
              getVariation(SSO_SELF_CONFIG_FLAG, { organizationId: orgId }),
              getOrgFeature(orgId, 'self_configure_sso')
            ]).then(([variation, ssoFeatureEnabled]) => {
              nav.ssoEnabled = variation && ssoFeatureEnabled;
            });

            TokenStore.getOrganization(orgId).then(org => {
              const FeatureService = createLegacyFeatureService(orgId, 'organization');

              nav.pricingVersion = org.pricingVersion;
              nav.isOwnerOrAdmin = isOwnerOrAdmin(org);

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
          if: 'nav.hasSettingsTab',
          title: 'Organization information',
          // TODO use cf-sref for navbar links
          sref: 'account.organizations.edit({orgId: nav.orgId})',
          rootSref: 'account.organizations.edit',
          inheritUrlParams: false,
          icon: 'nav-organization-information',
          dataViewType: 'organization-information'
        },
        {
          if: 'nav.pricingVersion == "pricing_version_1" && nav.isOwnerOrAdmin',
          title: 'Subscription',
          sref: 'account.organizations.subscription({orgId: nav.orgId})',
          rootSref: 'account.organizations.subscription',
          inheritUrlParams: false,
          icon: 'nav-organization-subscription',
          dataViewType: 'subscription'
        },
        {
          if: 'nav.pricingVersion == "pricing_version_2" && nav.isOwnerOrAdmin',
          title: 'Subscription',
          sref: 'account.organizations.subscription_new({orgId: nav.orgId})',
          rootSref: 'account.organizations.subscription_new',
          inheritUrlParams: false,
          icon: 'nav-organization-subscription',
          dataViewType: 'subscription-new'
        },
        {
          if: 'nav.hasBillingTab',
          title: 'Billing',
          sref: 'account.organizations.billing({orgId: nav.orgId})',
          rootSref: 'account.organizations.billing',
          inheritUrlParams: false,
          icon: 'nav-organization-billing',
          dataViewType: 'billing'
        },
        {
          if: 'nav.pricingVersion == "pricing_version_2" && nav.isOwnerOrAdmin',
          title: 'Usage',
          sref: 'account.organizations.usage({orgId: nav.orgId})',
          rootSref: 'account.organizations.usage',
          inheritUrlParams: false,
          icon: 'nav-usage',
          dataViewType: 'platform-usage'
        },
        {
          if: 'nav.isOwnerOrAdmin',
          title: 'Users',
          sref: 'account.organizations.users.list({orgId: nav.orgId})',
          rootSref: 'account.organizations.users',
          inheritUrlParams: false,
          icon: 'nav-organization-users',
          dataViewType: 'organization-users'
        },
        {
          title: 'Teams',
          label: 'new',
          sref: 'account.organizations.teams({orgId: nav.orgId})',
          rootSref: 'account.organizations.teams',
          inheritUrlParams: false,
          icon: 'nav-organization-teams',
          dataViewType: 'organization-teams'
        },
        {
          if: 'nav.ssoEnabled && nav.isOwnerOrAdmin',
          title: 'SSO',
          sref: 'account.organizations.sso({orgId: nav.orgId})',
          rootSref: 'account.organizations.sso',
          inheritUrlParams: false,
          icon: 'nav-organization-sso',
          dataViewType: 'organization-sso'
        },
        {
          if: 'nav.pricingVersion == "pricing_version_1" && nav.isOwnerOrAdmin',
          title: 'Spaces',
          sref: 'account.organizations.spaces({orgId: nav.orgId})',
          rootSref: 'account.organizations.spaces',
          inheritUrlParams: false,
          icon: 'nav-spaces',
          dataViewType: 'organization-spaces'
        },
        {
          if: 'nav.hasOffsiteBackup && nav.isOwnerOrAdmin',
          title: 'Offsite backup',
          sref: 'account.organizations.offsitebackup({orgId: nav.orgId})',
          rootSref: 'account.organizations.offsitebackup',
          inheritUrlParams: false,
          dataViewType: 'offsite-backup'
        }
      ]);
    }
  });
}
