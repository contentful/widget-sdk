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
import { routes } from 'core/react-routing';

function getItems(params, { orgId }) {
  const shouldDisplayAccessTools = params.isOwnerOrAdmin;
  const orgSpacesRoute = routes['organizations.spaces']({}, { orgId });
  const usageRoute = routes['organizations.usage']({}, { orgId });
  const editRoute = routes['organizations.edit']({}, { orgId });
  const offsiteBackupRoute = routes['organizations.offsitebackup']({}, { orgId });
  const subscriptionV1Route = routes['organizations.subscription_v1']({}, { orgId });
  const billing = routes['organizations.billing']({}, { orgId });
  const userProvisioning = routes['organizations.access-tools.user-provisioning']({}, { orgId });

  const orgnaizationSettingsSSORoute = routes['organizations.access-tools.sso']({}, { orgId });

  const accessToolsDropdownItems = [
    {
      title: 'Single Sign-On (SSO)',
      sref: orgnaizationSettingsSSORoute.path,
      srefParams: orgnaizationSettingsSSORoute.params,
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'organization-sso',
    },
    {
      title: 'User provisioning',
      sref: userProvisioning.path,
      srefParams: userProvisioning.params,
      rootSref: userProvisioning.path,
      srefOptions: { inherit: false },
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
      sref: editRoute.path,
      srefParams: editRoute.params,
      rootSref: editRoute.path,
      srefOptions: {
        inherit: false,
      },
      navIcon: 'OrgInfo',
      dataViewType: 'organization-information',
    },
    {
      if: params.pricingVersion == 'pricing_version_1' && params.isOwnerOrAdmin,
      title: 'Subscription',
      sref: subscriptionV1Route.path,
      srefParams: subscriptionV1Route.params,
      rootSref: subscriptionV1Route.path,
      srefOptions: {
        inherit: false,
      },
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
      sref: billing.path,
      srefParams: billing.params,
      rootSref: billing.path,
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Billing',
      dataViewType: 'billing',
    },
    {
      if: params.pricingVersion == 'pricing_version_2' && params.isOwnerOrAdmin,
      title: 'Usage',
      sref: usageRoute.path,
      srefParams: usageRoute.params,
      rootSref: usageRoute.path,
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
      sref: orgSpacesRoute.path,
      srefParams: orgSpacesRoute.params,
      rootSref: orgSpacesRoute.path,
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Spaces',
      dataViewType: 'organization-spaces',
    },
    {
      if: params.hasOffsiteBackup && params.isOwnerOrAdmin,
      title: 'Offsite backup',
      sref: offsiteBackupRoute.path,
      srefParams: offsiteBackupRoute.params,
      rootSref: offsiteBackupRoute.path,
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
