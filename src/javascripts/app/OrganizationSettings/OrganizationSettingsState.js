import base from 'states/Base';
import { iframeStateWrapper } from 'states/utils';

import subscriptionState from './Subscription/SubscriptionState';
import usageState from './Usage/UsageState';
import teamsState from './Teams/TeamsState';
import { inviteUsersState, userDetailState, usersListState } from './Users/UsersState';
import userInvitationsState from './UserInvitations/UserInvitationsList/UserInvitationsListRoutingState';
import userInvitationDetailState from './UserInvitations/UserInvitationDetail/UserInvitationDetailRoutingState';
import accessToolsState from './AccessToolsState';
import ssoRoutingState from './SSO/SSOSetupRoutingState';
import gatekeeperStates from './OrganizationSettingsGatekeeperStates';
import OrganizationNavBar from 'navigation/OrganizationNavBar';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';
import appsState from 'app/Apps/routes/management';
import * as TokenStore from 'services/TokenStore';
import { isDeveloper, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { go } from 'states/Navigator';

const usersAndInvitationsState = base({
  name: 'users',
  abstract: true,
  params: {
    orgId: ''
  },
  children: [
    inviteUsersState,
    userDetailState,
    usersListState,
    userInvitationsState,
    userInvitationDetailState
  ]
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
      } else if (isOwnerOrAdmin(organization)) {
        const hasNewPricing = !isLegacyOrganization(organization);

        path = [...path, hasNewPricing ? 'subscription_new' : 'subscription'];
      } else {
        // They are a member and the member path should go to organization/teams
        path = [...path, 'teams'];
      }

      go({
        path: path,
        params: { orgId: organization.sys.id }
      });
    }
  ]
};

export default [
  iframeStateWrapper({
    name: 'new_organization',
    url: '/organizations/new',
    navComponent: EmptyNavigationBar,
    title: 'Create new organization'
  }),
  organizationSettings,
  base({
    name: 'organizations',
    url: '/organizations/:orgId',
    abstract: true,
    navComponent: OrganizationNavBar,
    children: [
      usageState,
      usersAndInvitationsState,
      subscriptionState,
      teamsState,
      appsState,
      ssoRoutingState,
      accessToolsState,
      ...gatekeeperStates
    ]
  })
];
