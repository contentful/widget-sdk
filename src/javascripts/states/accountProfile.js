import base from 'states/Base';
import { iframeStateWrapper, reactStateWrapper } from './utils';
import { noop } from 'lodash';
import ProfileNavigationBar from 'navigation/ProfileNavigationBar';

const user = reactStateWrapper({
  loadingText: 'Loading your account…',
  onEnter: [noop],
  name: 'user',
  title: 'User profile',
  url: '/user',
  componentPath: 'app/UserProfile/Settings'
});

const spaceMemberships = reactStateWrapper({
  name: 'space_memberships',
  title: 'Space memberships',
  loadingText: 'Loading spaces…',
  url: '/space_memberships',
  componentPath: 'app/UserSettings/SpaceMemberships'
});

const organizationMemberships = userBase({
  name: 'organization_memberships',
  title: 'Organization memberships',
  url: '/organization_memberships{pathSuffix:PathSuffix}'
});

const accessGrants = userBase({
  name: 'access_grants',
  title: 'OAuth tokens',
  url: '/access_grants{pathSuffix:PathSuffix}'
});

const applications = userBase({
  name: 'applications',
  title: 'Applications',
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
    spaceMemberships,
    organizationMemberships,
    accessGrants,
    applications
  ]
});
