import React from 'react';
import base from 'states/Base';
import * as Analytics from 'analytics/Analytics';
import { subscriptionState } from 'features/organization-subscription';
import { usageState } from 'features/organization-usage';
import { teamsState } from 'features/teams';
import { inviteUsersState, userDetailState, usersListState } from './Users/UsersState';
import accessToolsState from './AccessToolsState';
import { SSOSetupRoutingState } from 'features/sso';
import {
  billing,
  edit,
  offsitebackup,
  spaces,
  subscription,
  subscriptionBilling,
  userGatekeeper,
} from './OrganizationSettingsGatekeeperStates';
import { billingRoutingState } from 'features/organization-billing';
import OrganizationNavBar from 'navigation/OrganizationNavBar';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import { managementRoute as appsState } from 'features/apps';
import * as TokenStore from 'services/TokenStore';
import { isDeveloper, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { go } from 'states/Navigator';
import { isOrganizationOnTrial } from 'features/trials';
import AccountView from 'account/AccountView';

const resolveOrganizationData = [
  '$stateParams',
  ($stateParams) => TokenStore.getOrganization($stateParams.orgId),
];

const usersAndInvitationsState = base({
  name: 'users',
  abstract: true,
  params: {
    orgId: '',
  },
  children: [inviteUsersState, userDetailState, usersListState],
});

// Psuedo route to handle which path a user should be redirected to when they click on "Go to Organization" in the account profile page.
const organizationSettings = {
  name: 'organization_settings',
  url: '/organization_settings',
  params: { orgId: '' },
  onEnter: [
    '$stateParams',
    async ({ orgId }) => {
      const organization = await TokenStore.getOrganization(orgId);

      let path = ['account', 'organizations'];

      if (isDeveloper(organization)) {
        path = [...path, 'apps', 'list'];
      } else if (isOwnerOrAdmin(organization) || isOrganizationOnTrial(organization)) {
        // the subscription page is available to users of any role when the org is on trial
        const hasNewPricing = !isLegacyOrganization(organization);

        path = [...path, hasNewPricing ? 'subscription_new' : 'subscription'];
      } else {
        // They are a member and the member path should go to organization/teams
        path = [...path, 'teams'];
      }

      go({
        path: path,
        params: { orgId: organization.sys.id },
        options: { location: 'replace' },
      });
    },
  ],
};

export default [
  {
    name: 'new_organization',
    url: '/organizations/new',
    navComponent: EmptyNavigationBar,
    component: () => <AccountView title="Create new organization" />,
  },
  organizationSettings,
  base({
    name: 'organizations',
    url: '/organizations/:orgId',
    abstract: true,
    resolve: {
      organizationData: resolveOrganizationData,
    },
    onEnter: [
      'organizationData',
      (organizationData) => Analytics.trackContextChange(undefined, organizationData),
    ],
    navComponent: OrganizationNavBar,
    children: [
      usageState,
      usersAndInvitationsState,
      subscriptionState,
      teamsState,
      appsState,
      SSOSetupRoutingState,
      accessToolsState,
      billingRoutingState,
      billing,
      edit,
      offsitebackup,
      spaces,
      subscription,
      subscriptionBilling,
      userGatekeeper,
    ],
  }),
];
