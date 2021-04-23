import React from 'react';
import ProfileNavigationBar from 'navigation/ProfileNavigationBar';
import { OrganizationsRouter } from 'app/UserSettings/OrganisationsReactRouter';

import AccountView from 'account/AccountView';
import { userProfileState } from 'features/user-profile';
import { accountCMATokensRouteState, spaceMembershipsRouteState } from 'features/account-settings';

const organizationMemberships = {
  name: 'organization_memberships',
  url: '/organization_memberships{pathname:any}',
  params: {
    navigationState: null,
  },
  component: OrganizationsRouter,
};

const accessGrants = {
  name: 'access_grants',
  url: '/access_grants{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: () => <AccountView title="OAuth tokens" icon="Token" />,
};

const applications = {
  name: 'applications',
  url: '/developers/applications{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: () => <AccountView title="OAuth applications" icon="Oauth" />,
};

const userCancellation = {
  name: 'user_cancellation',
  url: '/user_cancellation{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: () => <AccountView title="User cancellation" />,
};

export default {
  name: 'profile',
  url: '/profile',
  abstract: true,
  navComponent: ProfileNavigationBar,
  children: [
    userCancellation,
    userProfileState,
    accountCMATokensRouteState,
    spaceMembershipsRouteState,
    organizationMemberships,
    accessGrants,
    applications,
  ],
};
