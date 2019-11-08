import base from 'states/Base.es6';
import { iframeStateWrapper } from 'states/utils.es6';

import subscriptionState from './Subscription/SubscriptionState.es6';
import usageState from './Usage/UsageState.es6';
import teamsState from './Teams/TeamsState.es6';
import { inviteUsersState, userDetailState, usersListState } from './Users/UsersState.es6';
import userInvitationsState from './UserInvitations/UserInvitationsList/UserInvitationsListRoutingState.es6';
import userInvitationDetailState from './UserInvitations/UserInvitationDetail/UserInvitationDetailRoutingState.es6';
import ssoRoutingState from './SSO/SSOSetupRoutingState.es6';
import gatekeeperStates from './OrganizationSettingsGatekeeperStates.es6';
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
