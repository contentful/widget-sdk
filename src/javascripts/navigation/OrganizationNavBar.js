import React from 'react';
import PropTypes from 'prop-types';
import NavBar from './NavBar/NavBar';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import * as TokenStore from 'services/TokenStore.es6';
import { SSO_SELF_CONFIG_FLAG } from 'featureFlags.es6';
import { getOrgFeature } from '../data/CMA/ProductCatalog.es6';
import createLegacyFeatureService from 'services/LegacyFeatureService.es6';

import { getVariation } from 'LaunchDarkly.es6';

function getItems(params, { orgId }) {
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
      icon: 'nav-organization-information',
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
      icon: 'nav-organization-subscription',
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
      icon: 'nav-organization-subscription',
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
      icon: 'nav-organization-billing',
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
      icon: 'nav-usage',
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
      icon: 'nav-organization-users',
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
      icon: 'nav-organization-teams',
      dataViewType: 'organization-teams'
    },
    {
      if: params.ssoEnabled && params.isOwnerOrAdmin,
      title: 'SSO',
      sref: 'account.organizations.sso',
      srefParams: { orgId },
      rootSref: 'account.organizations.sso',
      srefOptions: {
        inherit: false
      },
      icon: 'nav-organization-sso',
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
      icon: 'nav-spaces',
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
    const [variation, ssoFeatureEnabled, organization, hasOffsiteBackup] = await Promise.all([
      getVariation(SSO_SELF_CONFIG_FLAG, { organizationId: orgId }),
      getOrgFeature(orgId, 'self_configure_sso'),
      TokenStore.getOrganization(orgId),
      FeatureService.get('offsiteBackup')
    ]);

    const params = {
      ssoEnabled: variation && ssoFeatureEnabled,
      pricingVersion: organization.pricingVersion,
      isOwnerOrAdmin: isOwnerOrAdmin(organization),
      hasOffsiteBackup,
      hasBillingTab: organization.isBillable && isOwner(organization),
      hasSettingsTab: isOwner(organization)
    };

    this.setState({ items: getItems(params, { orgId }) });
  }

  render() {
    return (
      <NavBar
        showQuickNavigation={false}
        showModernStackOnboardingRelaunch={false}
        listItems={this.state.items}
      />
    );
  }
}

OrganizationNavigationBar.propTypes = {
  stateParams: PropTypes.shape({
    orgId: PropTypes.string.isRequired
  }).isRequired
};
