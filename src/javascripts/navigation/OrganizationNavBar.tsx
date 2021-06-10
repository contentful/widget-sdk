import React from 'react';
import PropTypes from 'prop-types';
import NavBar from './NavBar/NavBar';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import { getOrgFeature, OrganizationFeatures } from '../data/CMA/ProductCatalog';
import { SidepanelContainer } from './Sidepanel/SidepanelContainer';
import createLegacyFeatureService from 'services/LegacyFeatureService';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import { isOrganizationOnTrial } from 'features/trials';
import { routes } from 'core/react-routing';

function getItems(params, { orgId }) {
  const shouldDisplayAccessTools = params.isOwnerOrAdmin;

  const makeReactRouterRef = (route: keyof typeof routes) => {
    // @ts-expect-error ignore "params" arg, we expect only .list routes
    const state = routes[route]({}, { orgId });
    return {
      sref: state.path,
      srefParams: state.params,
      rootSref: state.path,
    };
  };

  const accessToolsDropdownItems = [
    {
      title: 'Single Sign-On (SSO)',
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'organization-sso',
      ...makeReactRouterRef('organizations.access-tools.sso'),
    },
    {
      title: 'User provisioning',
      srefOptions: { inherit: false },
      dataViewType: 'organization-user-provisioning',
      ...makeReactRouterRef('organizations.access-tools.user-provisioning'),
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
      srefOptions: {
        inherit: false,
      },
      navIcon: 'OrgInfo',
      dataViewType: 'organization-information',
      ...makeReactRouterRef('organizations.edit'),
    },
    {
      if: params.pricingVersion == 'pricing_version_1' && params.isOwnerOrAdmin,
      title: 'Subscription',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Subscription',
      dataViewType: 'subscription',
      ...makeReactRouterRef('organizations.subscription_v1'),
    },
    {
      if:
        params.pricingVersion == 'pricing_version_2' &&
        (params.isOwnerOrAdmin || params.isOrganizationOnTrial),
      title: 'Subscription',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Subscription',
      dataViewType: 'subscription-new',
      ...makeReactRouterRef('organizations.subscription.overview'),
    },
    {
      if: params.hasBillingTab,
      title: 'Billing',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Billing',
      dataViewType: 'billing',
      ...makeReactRouterRef('organizations.billing'),
    },
    {
      if: params.pricingVersion == 'pricing_version_2' && params.isOwnerOrAdmin,
      title: 'Usage',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Usage',
      dataViewType: 'platform-usage',
      ...makeReactRouterRef('organizations.usage'),
    },
    {
      if: params.isOwnerOrAdmin,
      title: 'Users',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Users',
      dataViewType: 'organization-users',
      ...makeReactRouterRef('organizations.users.list'),
    },
    {
      title: 'Teams',
      highValueLabel: params.highValueLabelEnabled,
      isOrganizationOnTrial: params.isOrganizationOnTrial,
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Teams',
      dataViewType: 'organization-teams',
      tooltip: teamsTooltip,
      ...makeReactRouterRef('organizations.teams'),
    },
    {
      if: params.hasAdvancedExtensibility,
      title: 'Apps',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Apps',
      dataViewType: 'organization-apps',
      ...makeReactRouterRef('organizations.apps.list'),
    },
    {
      if: shouldDisplayAccessTools,
      title: 'Access Tools',
      navIcon: 'Sso',
      dataViewType: 'organization-access-tools',
      children: accessToolsDropdownItems,
    },
    {
      if: params.pricingVersion == 'pricing_version_1' && params.isOwnerOrAdmin,
      title: 'Spaces',
      srefOptions: {
        inherit: false,
      },
      navIcon: 'Spaces',
      dataViewType: 'organization-spaces',
      ...makeReactRouterRef('organizations.spaces'),
    },
    {
      if: params.hasOffsiteBackup && params.isOwnerOrAdmin,
      title: 'Offsite backup',
      srefOptions: {
        inherit: false,
      },
      dataViewType: 'offsite-backup',
      ...makeReactRouterRef('organizations.offsitebackup'),
    },
  ].filter((item) => item.if !== false);
}

type Props = {
  orgId: string;
  navVersion: string;
};
type State = {
  items: any[];
};

export default class OrganizationNavigationBar extends React.Component<Props, State> {
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
    const { orgId } = this.props;
    const FeatureService = createLegacyFeatureService(orgId, 'organization');

    const organization = await TokenStore.getOrganization(orgId);

    const promises = [
      getOrgFeature(orgId, OrganizationFeatures.SELF_CONFIGURE_SSO),
      getOrgFeature(orgId, OrganizationFeatures.SCIM),
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
      <div className="app-top-bar">
        <SidepanelContainer />
        <div className="app-top-bar__outer-wrapper">
          <NavBar
            showQuickNavigation={false}
            showModernStackOnboardingRelaunch={false}
            listItems={this.state.items}
            organizationId={this.props.orgId}
          />
        </div>
      </div>
    );
  }
}
