import React from 'react';
import PropTypes from 'prop-types';
import NavBar from './NavBar/NavBar';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import { getOrgFeature } from '../data/CMA/ProductCatalog';
import SidepanelContainer from './Sidepanel/SidepanelContainer';
import createLegacyFeatureService from 'services/LegacyFeatureService';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import { isOrganizationOnTrial } from 'features/trials';

function getItems(params, { orgId }) {
  const shouldDisplayAccessTools = params.isOwnerOrAdmin;

  const accessToolsDropdownItems = [
    {
      title: 'Single Sign-On (SSO)',
      sref: 'account.organizations.access-tools.sso',
      srefParams: { orgId },
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'organization-sso',
    },
    {
      title: 'User provisioning',
      sref: 'account.organizations.access-tools.user-provisioning',
      srefParams: { orgId },
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'organization-user-provisioning',
    },
  ];

  const teamsTooltip = params.highValueLabelEnabled
    ? params.isOrganizationOnTrial
      ? 'This feature is a part of Enterprise plan. You can use it during your trial.'
      : 'This feature is a part of Enterprise plan. '
    : null;

  return [
    {
      if: params.hasSettingsTab,
      title: 'Organization information',
      sref: 'account.organizations.edit',
      srefParams: { orgId },
      srefOptions: {
        inherit: false,
      },
      rootSref: 'account.organizations.edit',
      navIcon: 'OrgInfo',
      dataViewType: 'organization-information',
    },
    {
      if: params.pricingVersion == 'pricing_version_1' && params.isOwnerOrAdmin,
      title: 'Subscription',
      sref: 'account.organizations.subscription',
      srefParams: { orgId },
      srefOptions: {
        inherit: false,
      },
      rootSref: 'account.organizations.subscription',
      navIcon: 'Subscription',
      dataViewType: 'subscription',
    },
    {
      if:
        params.pricingVersion == 'pricing_version_2' &&
        (params.isOwnerOrAdmin || params.isOrganizationOnTrial),
      title: 'Subscription',
      sref: 'account.organizations.subscription_new',
      srefParams: { orgId },
      rootSref: 'account.organizations.subscription_new',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Subscription',
      dataViewType: 'subscription-new',
    },
    {
      if: params.hasBillingTab,
      title: 'Billing',
      sref: 'account.organizations.billing',
      srefParams: { orgId },
      rootSref: 'account.organizations.billing',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Billing',
      dataViewType: 'billing',
    },
    {
      if: params.pricingVersion == 'pricing_version_2' && params.isOwnerOrAdmin,
      title: 'Usage',
      sref: 'account.organizations.usage',
      srefParams: { orgId },
      rootSref: 'account.organizations.usage',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Usage',
      dataViewType: 'platform-usage',
    },
    {
      if: params.isOwnerOrAdmin,
      title: 'Users',
      sref: 'account.organizations.users.list',
      srefParams: { orgId },
      rootSref: 'account.organizations.users',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Users',
      dataViewType: 'organization-users',
    },
    {
      title: 'Teams',
      sref: 'account.organizations.teams',
      highValueLabel: params.highValueLabelEnabled,
      isOrganizationOnTrial: params.isOrganizationOnTrial,
      srefParams: { orgId },
      rootSref: 'account.organizations.teams',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Teams',
      dataViewType: 'organization-teams',
      tooltip: teamsTooltip,
    },
    {
      if: params.hasAdvancedExtensibility,
      title: 'Apps',
      sref: 'account.organizations.apps.list',
      srefParams: { orgId },
      rootSref: 'account.organizations.apps',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Apps',
      icon: 'nav-apps',
      dataViewType: 'organization-apps',
    },
    {
      if: shouldDisplayAccessTools,
      title: 'Access Tools',
      rootSref: 'account.organizations.access-tools',
      navIcon: 'Sso',
      dataViewType: 'organization-access-tools',
      children: accessToolsDropdownItems,
    },
    {
      if: params.pricingVersion == 'pricing_version_1' && params.isOwnerOrAdmin,
      title: 'Spaces',
      sref: 'account.organizations.spaces',
      srefParams: { orgId },
      rootSref: 'account.organizations.spaces',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Spaces',
      dataViewType: 'organization-spaces',
    },
    {
      if: params.hasOffsiteBackup && params.isOwnerOrAdmin,
      title: 'Offsite backup',
      sref: 'account.organizations.offsitebackup',
      srefParams: { orgId },
      rootSref: 'account.organizations.offsitebackup',
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'offsite-backup',
    },
  ].filter((item) => item.if !== false);
}

export default class OrganizationNavigationBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };
  }

  static propTypes = {
    navVersion: PropTypes.number,
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

    const organization = await TokenStore.getOrganization(orgId);

    const promises = [
      getOrgFeature(orgId, 'self_configure_sso'),
      getOrgFeature(orgId, 'scim'),
      FeatureService.get('offsiteBackup'),
      AdvancedExtensibilityFeature.isEnabled(),
      getVariation(FLAGS.HIGH_VALUE_LABEL, { organizationId: orgId }),
    ];

    const [
      ssoFeatureEnabled,
      scimFeatureEnabled,
      hasOffsiteBackup,
      hasAdvancedExtensibility,
      highValueLabelEnabled,
    ] = await Promise.all(promises);

    const params = {
      ssoEnabled: ssoFeatureEnabled,
      userProvisioningEnabled: scimFeatureEnabled,
      pricingVersion: organization.pricingVersion,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
      hasAdvancedExtensibility,
      hasOffsiteBackup,
      hasBillingTab: organization.isBillable && isOwner(organization),
      hasSettingsTab: isOwner(organization),
      highValueLabelEnabled: highValueLabelEnabled && !organization.isBillable,
      isOrganizationOnTrial: isOrganizationOnTrial(organization),
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
            organizationId={this.props.stateParams.orgId}
          />
        </div>
      </>
    );
  }
}

OrganizationNavigationBar.propTypes = {
  stateParams: PropTypes.shape({
    orgId: PropTypes.string.isRequired,
  }).isRequired,
};
