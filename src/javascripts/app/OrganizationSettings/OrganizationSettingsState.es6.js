import Base from 'states/Base.es6';

import subscriptionState from './Subscription/SubscriptionState.es6';
import usageState from './Usage/UsageState.es6';
import teamsState from './Teams/TeamsState.es6';
import usersState from './Users/UsersState.es6';
import userInvitationsState from './UserInvitations/UserInvitationsList/UserInvitationsListRoutingState.es6';
import userInvitationDetailState from './UserInvitations/UserInvitationDetail/UserInvitationDetailRoutingState.es6';
import gatekeeperStates from './OrganizationSettingsGatekeeperStates.es6';

export default Base({
  name: 'organizations',
  url: '/organizations',
  abstract: true,
  views: {
    'nav-bar@': {
      template: '<cf-organization-nav class="app-top-bar__child" />'
    }
  },
  children: [
    usageState,
    usersState,
    subscriptionState,
    teamsState,
    userInvitationsState,
    userInvitationDetailState,
    ...gatekeeperStates
  ]
});
