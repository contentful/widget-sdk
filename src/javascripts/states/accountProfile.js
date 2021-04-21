import React from 'react';
import ProfileNavigationBar from 'navigation/ProfileNavigationBar';

import SpaceMembershipsRouter from 'app/UserSettings/SpaceMembershipsRouter';
import OrganizationMembershipsRoute from 'app/UserSettings/OrganizationsRoute';

import AccountView from 'account/AccountView';
import { userProfileState } from 'features/user-profile';
import { accountCMATokensRouteState } from 'features/account-settings';

const spaceMemberships = {
  name: 'space_memberships',
  url: '/space_memberships',
  component: SpaceMembershipsRouter,
};

const organizationMemberships = {
  name: 'organization_memberships',
  url: '/organization_memberships',
  component: OrganizationMembershipsRoute,
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
    spaceMemberships,
    organizationMemberships,
    accessGrants,
    applications,
  ],
};
