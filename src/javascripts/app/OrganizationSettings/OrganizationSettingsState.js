import base from 'states/Base';
import { iframeStateWrapper } from 'states/utils';

import subscriptionState from './Subscription/SubscriptionState';
import usageState from './Usage/UsageState';
import teamsState from './Teams/TeamsState';
import { inviteUsersState, userDetailState, usersListState } from './Users/UsersState';
import userInvitationsState from './UserInvitations/UserInvitationsList/UserInvitationsListRoutingState';
import userInvitationDetailState from './UserInvitations/UserInvitationDetail/UserInvitationDetailRoutingState';
import ssoRoutingState from './SSO/SSOSetupRoutingState';
import gatekeeperStates from './OrganizationSettingsGatekeeperStates';
import OrganizationNavBar from 'navigation/OrganizationNavBar';

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

export default [
  iframeStateWrapper({
    name: 'new_organization',
    url: '/organizations/new',
    title: 'Create new organization',
    navComponent: () => null
  }),
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
      ssoRoutingState,
      ...gatekeeperStates
    ]
  })
];
