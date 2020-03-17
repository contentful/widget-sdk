import base from 'states/Base';
import { iframeStateWrapper } from './utils';
import { noop } from 'lodash';
import ProfileNavigationBar from 'navigation/ProfileNavigationBar';
import Settings from 'app/UserProfile/Settings';
import SpaceMemberships from 'app/UserSettings/SpaceMemberships';
import OrganizationMembershipsRoute from 'app/UserSettings/OrganizationsRoute';
import UserCMATokens from 'app/UserCMATokens/UserCMATokens';

const user = {
  name: 'user',
  url: '/user',
  component: Settings
};

const spaceMemberships = {
  name: 'space_memberships',
  url: '/space_memberships',
  component: SpaceMemberships
};

const organizationMemberships = {
  name: 'organization_memberships',
  url: '/organization_memberships',
  component: OrganizationMembershipsRoute
};

const cmaTokens = {
  name: 'cma_tokens',
  url: '/cma_tokens',
  component: UserCMATokens
};

const accessGrants = userBase({
  name: 'access_grants',
  title: 'OAuth tokens',
  icon: 'token',
  url: '/access_grants{pathSuffix:PathSuffix}'
});

const applications = userBase({
  name: 'applications',
  title: 'OAuth applications',
  icon: 'oauth',
  url: '/developers/applications{pathSuffix:PathSuffix}'
});

const userCancellation = userBase({
  name: 'user_cancellation',
  title: 'User cancellation',
  url: '/user_cancellation{pathSuffix:PathSuffix}'
});

function userBase(definition) {
  return iframeStateWrapper({
    loadingText: 'Loading your account…',
    onEnter: [noop],
    ...definition
  });
}

export default base({
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
    applications
  ]
});
