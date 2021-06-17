import React from 'react';
import NavBar from './NavBar/NavBar';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import * as TokenStore from 'services/TokenStore';
import { getOrgFeature, OrganizationFeatures } from '../data/CMA/ProductCatalog';
import { SidepanelContainer } from './Sidepanel/SidepanelContainer';
import { FLAGS, getVariation } from 'core/feature-flags';
import { AdvancedExtensibilityFeature } from 'features/extensions-management';
import { isOrganizationOnTrial } from 'features/trials';
import { getOrganization } from 'services/TokenStore';
import { TrialTag } from 'features/trials';
import { OrganizationName, StateTitle } from './Sidepanel/SidePanelTrigger/SidePanelTrigger';
import { OrganizationProp as Organization } from 'contentful-management/types';
import { ReactRouterNavigationItemType } from './NavBar/ReactRouterNavigationItem';

function getItems(params, { orgId }): ReactRouterNavigationItemType[] {
  const shouldDisplayAccessTools = params.isOwnerOrAdmin;

  const accessToolsDropdownItems = [
    {
      title: 'Single Sign-On (SSO)',
      dataViewType: 'organization-sso',
      route: { path: 'organizations.access-tools.sso', orgId },
    } as ReactRouterNavigationItemType,
    {
      title: 'User provisioning',
      dataViewType: 'organization-user-provisioning',
      route: { path: 'organizations.access-tools.user-provisioning', orgId },
    } as ReactRouterNavigationItemType,
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
      navIcon: 'OrgInfo',
      dataViewType: 'organization-information',
      route: { path: 'organizations.edit', orgId },
    } as ReactRouterNavigationItemType,
    {
      if: params.isOwnerOrAdmin || params.isOrganizationOnTrial,
      title: 'Subscription',
      navIcon: 'Subscription',
      dataViewType: 'subscription-new',
      route: { path: 'organizations.subscription.overview', orgId },
    } as ReactRouterNavigationItemType,
    {
      if: params.hasBillingTab,
      title: 'Billing',
      navIcon: 'Billing',
      dataViewType: 'billing',
      route: { path: 'organizations.billing', orgId },
    } as ReactRouterNavigationItemType,
    {
      if: params.isOwnerOrAdmin,
      title: 'Usage',
      navIcon: 'Usage',
      dataViewType: 'platform-usage',
      route: { path: 'organizations.usage', orgId },
    } as ReactRouterNavigationItemType,
    {
      if: params.isOwnerOrAdmin,
      title: 'Users',
      navIcon: 'Users',
      dataViewType: 'organization-users',
      route: { path: 'organizations.users.list', orgId },
    } as ReactRouterNavigationItemType,
    {
      title: 'Teams',
      highValueLabel: params.highValueLabelEnabled,
      isOrganizationOnTrial: params.isOrganizationOnTrial,
      navIcon: 'Teams',
      dataViewType: 'organization-teams',
      tooltip: teamsTooltip,
      route: { path: 'organizations.teams', orgId },
    } as ReactRouterNavigationItemType,
    {
      if: params.hasAdvancedExtensibility,
      title: 'Apps',
      navIcon: 'Apps',
      dataViewType: 'organization-apps',
      route: { path: 'organizations.apps.list', orgId },
    } as ReactRouterNavigationItemType,
    {
      if: shouldDisplayAccessTools,
      title: 'Access Tools',
      navIcon: 'Sso',
      dataViewType: 'organization-access-tools',
      children: accessToolsDropdownItems,
      isActiveFn: (pathname) => {
        return pathname.startsWith(`/account/organizations/${orgId}/access_tools`);
      },
    } as ReactRouterNavigationItemType,
  ].filter((item) => item.if !== false);
}

type Props = {
  orgId: string;
};

type State = {
  items: ReactRouterNavigationItemType[];
};

const OrganizationSidepanelTrigger = React.memo(
  ({ organizationId }: { organizationId: string }) => {
    const [organization, setOrganization] = React.useState<null | Organization>(null);

    React.useEffect(() => {
      getOrganization(organizationId).then((data) => {
        setOrganization(data);
      });
    }, [organizationId]);

    if (!organization) {
      return null;
    }

    return (
      <>
        <OrganizationName name={organization.name} />
        <StateTitle title="Organization settings" />
      </>
    );
  }
);

export default class OrganizationNavigationBar extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };
  }

  async componentDidMount() {
    this.getConfiguration();
  }

  async componentDidUpdate(prevProps) {
    if (this.props.orgId !== prevProps.orgId) {
      this.getConfiguration();
    }
  }

  async getConfiguration() {
    const { orgId } = this.props;

    const organization = await TokenStore.getOrganization(orgId);

    const promises = [
      getOrgFeature(orgId, OrganizationFeatures.SELF_CONFIGURE_SSO),
      getOrgFeature(orgId, OrganizationFeatures.SCIM),
      AdvancedExtensibilityFeature.isEnabled(),
      getVariation(FLAGS.HIGH_VALUE_LABEL, { organizationId: orgId }),
    ];

    const [ssoFeatureEnabled, scimFeatureEnabled, hasAdvancedExtensibility, highValueLabelEnabled] =
      await Promise.all(promises);

    const params = {
      ssoEnabled: ssoFeatureEnabled,
      userProvisioningEnabled: scimFeatureEnabled,
      pricingVersion: organization.pricingVersion,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
      hasAdvancedExtensibility,
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
        <SidepanelContainer
          triggerText={<OrganizationSidepanelTrigger organizationId={this.props.orgId} />}
          currentOrgId={this.props.orgId}
        />
        <div className="app-top-bar__outer-wrapper">
          <NavBar reactRouterListItems={this.state.items}>
            <TrialTag organizationId={this.props.orgId} />
          </NavBar>
        </div>
      </div>
    );
  }
}
