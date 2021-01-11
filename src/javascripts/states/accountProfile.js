import React from 'react';
import ProfileNavigationBar from 'navigation/ProfileNavigationBar';
import Settings from 'app/UserProfile/Settings';
import SpaceMembershipsRouter from 'app/UserSettings/SpaceMembershipsRouter';
import OrganizationMembershipsRoute from 'app/UserSettings/OrganizationsRoute';
import { UserCMATokensRoute } from 'features/api-keys-management';
import AccountView from 'account/AccountView';

const user = {
  name: 'user',
  url: '/user',
  component: Settings,
};

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

const cmaTokens = {
  name: 'cma_tokens',
  url: '/cma_tokens',
  component: UserCMATokensRoute,
};

const accessGrants = {
  name: 'access_grants',
  url: '/access_grants{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: () => (
    <AccountView title="OAuth tokens" icon="Token" loadingText="Loading your account…" />
  ),
};

const applications = {
  name: 'applications',
  url: '/developers/applications{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: () => (
    <AccountView title="OAuth applications" icon="Oauth" loadingText="Loading your account…" />
  ),
};

const userCancellation = {
  name: 'user_cancellation',
  url: '/user_cancellation{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: () => <AccountView title="User cancellation" loadingText="Loading your account…" />,
};

export default {
  name: 'profile',
  url: '/profile',
  abstract: true,
  navComponent: ProfileNavigationBar,
  children: [
    userCancellation,
    user,
    cmaTokens,
    spaceMemberships,
    organizationMemberships,
    accessGrants,
    applications,
  ],
};
