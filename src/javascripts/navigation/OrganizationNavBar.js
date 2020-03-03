import React from 'react';
import PropTypes from 'prop-types';
import NavBar from './NavBar/NavBar';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import { ACCESS_TOOLS } from 'featureFlags';
import { getOrgFeature } from '../data/CMA/ProductCatalog';
import SidepanelContainer from './Sidepanel/SidepanelContainer';
import createLegacyFeatureService from 'services/LegacyFeatureService';
import { getVariation } from 'LaunchDarkly';
import * as AdvancedExtensibilityFeature from 'app/settings/extensions/services/AdvancedExtensibilityFeature';

function getItems(params, { orgId }) {
  const shouldDisplayAccessTools = params.accessToolsFeatureEnabled && params.isOwnerOrAdmin;
  const accessToolsDropdownItems = [
    {
      title: 'Single Sign-On (SSO)',
      sref: 'account.organizations.access-tools.sso',
      srefParams: { orgId },
      srefOptions: {
        inherit: false
      },
      dataViewType: 'organization-sso'
    },
    {
      title: 'User provisioning',
      sref: 'account.organizations.access-tools.user-provisioning',
      srefParams: { orgId },
      srefOptions: {
        inherit: false
      },
      dataViewType: 'organization-user-provisioning'
    }
  ];

  return [
    {
      if: params.hasSettingsTab,
      title: 'Organization information',
      sref: 'account.organizations.edit',
      srefParams: { orgId },
      srefOptions: {
        inherit: false
      },
      rootSref: 'account.organizations.edit',
      navIcon: 'org-info',
      dataViewType: 'organization-information'
    },
    {
      if: params.pricingVersion == 'pricing_version_1' && params.isOwnerOrAdmin,
      title: 'Subscription',
      sref: 'account.organizations.subscription',
      srefParams: { orgId },
      srefOptions: {
        inherit: false
      },
      rootSref: 'account.organizations.subscription',
      navIcon: 'subscription',
      dataViewType: 'subscription'
    },
    {
      if: params.pricingVersion == 'pricing_version_2' && params.isOwnerOrAdmin,
      title: 'Subscription',
      sref: 'account.organizations.subscription_new',
      srefParams: { orgId },
      rootSref: 'account.organizations.subscription_new',
      srefOptions: {
        inherit: false
      },
      navIcon: 'subscription',
      dataViewType: 'subscription-new'
    },

    {
      if: params.hasBillingTab,
      title: 'Billing',
      sref: 'account.organizations.billing',
      srefParams: { orgId },
      rootSref: 'account.organizations.billing',
      srefOptions: {
        inherit: false
      },
      navIcon: 'billing',
      dataViewType: 'billing'
    },
    {
      if: params.pricingVersion == 'pricing_version_2' && params.isOwnerOrAdmin,
      title: 'Usage',
      sref: 'account.organizations.usage',
      srefParams: { orgId },
      rootSref: 'account.organizations.usage',
      srefOptions: {
        inherit: false
      },
      navIcon: 'usage',
      dataViewType: 'platform-usage'
    },
    {
      if: params.isOwnerOrAdmin,
      title: 'Users',
      sref: 'account.organizations.users.list',
      srefParams: { orgId },
      rootSref: 'account.organizations.users',
      srefOptions: {
        inherit: false
      },
      navIcon: 'users',
      dataViewType: 'organization-users'
    },
    {
      title: 'Teams',
      sref: 'account.organizations.teams',
      srefParams: { orgId },
      rootSref: 'account.organizations.teams',
      srefOptions: {
        inherit: false
      },
      navIcon: 'teams',
      dataViewType: 'organization-teams'
    },
    {
      if: params.hasAdvancedExtensibility,
      title: 'Apps',
      sref: 'account.organizations.apps.list',
      srefParams: { orgId },
      rootSref: 'account.organizations.apps',
      srefOptions: {
        inherit: false
      },
      navIcon: 'apps',
      icon: 'nav-apps',
      dataViewType: 'organization-apps'
    },
    {
      if: shouldDisplayAccessTools,
      title: 'Access Tools',
      tagLabel: 'new',
      rootSref: 'account.organizations.access-tools',
      navIcon: 'sso',
      dataViewType: 'organization-access-tools',
      children: accessToolsDropdownItems
    },
    {
      if: !params.accessToolsFeatureEnabled && params.ssoEnabled && params.isOwnerOrAdmin,
      title: 'SSO',
      sref: 'account.organizations.sso',
      srefParams: { orgId },
      rootSref: 'account.organizations.sso',
      srefOptions: {
        inherit: false
      },
      navIcon: 'sso',
      dataViewType: 'organization-sso'
    },
    {
      if: params.pricingVersion == 'pricing_version_1' && params.isOwnerOrAdmin,
      title: 'Spaces',
      sref: 'account.organizations.spaces',
      srefParams: { orgId },
      rootSref: 'account.organizations.spaces',
      srefOptions: {
        inherit: false
      },
      navIcon: 'spaces',
      dataViewType: 'organization-spaces'
    },
    {
      if: params.hasOffsiteBackup && params.isOwnerOrAdmin,
      title: 'Offsite backup',
      sref: 'account.organizations.offsitebackup',
      srefParams: { orgId },
      rootSref: 'account.organizations.offsitebackup',
      srefOptions: {
        inherit: false
      },
      dataViewType: 'offsite-backup'
    }
  ].filter(item => item.if !== false);
}

export default class OrganizationNavigationBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: []
    };
  }

  static propTypes = {
    navVersion: PropTypes.number
  };

  async componentDidMount() {
    this.getConfiguration();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.navVersion !== prevProps.navVersion) {
      this.getConfiguration();
    }
  }

  async getConfiguration() {
    const { orgId } = this.props.stateParams;
    const FeatureService = createLegacyFeatureService(orgId, 'organization');
    const [
      ssoFeatureEnabled,
      scimFeatureEnabled,
      accessToolsFeatureEnabled,
      organization,
      hasOffsiteBackup,
      hasAdvancedExtensibility
    ] = await Promise.all([
      getOrgFeature(orgId, 'self_configure_sso'),
      getOrgFeature(orgId, 'scim'),
      getVariation(ACCESS_TOOLS, {
        organizationId: orgId
      }),
      TokenStore.getOrganization(orgId),
      FeatureService.get('offsiteBackup'),
      AdvancedExtensibilityFeature.isEnabled()
    ]);

    const params = {
      ssoEnabled: ssoFeatureEnabled,
      userProvisioningEnabled: scimFeatureEnabled,
      accessToolsFeatureEnabled: accessToolsFeatureEnabled,
      pricingVersion: organization.pricingVersion,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
      hasAdvancedExtensibility,
      hasOffsiteBackup,
      hasBillingTab: organization.isBillable && isOwner(organization),
      hasSettingsTab: isOwner(organization)
    };

    this.setState({ items: getItems(params, { orgId }) });
  }

  render() {
    return (
      <>
        <SidepanelContainer />
        <div className="app-top-bar__outer-wrapper">
          <NavBar
            showQuickNavigation={false}
            showModernStackOnboardingRelaunch={false}
            listItems={this.state.items}
          />
        </div>
      </>
    );
  }
}

OrganizationNavigationBar.propTypes = {
  stateParams: PropTypes.shape({
    orgId: PropTypes.string.isRequired
  }).isRequired
};
