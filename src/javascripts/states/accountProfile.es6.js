import base from 'states/Base.es6';
import { iframeStateWrapper, reactStateWrapper } from './utils.es6';
import { noop } from 'lodash';

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
  componentPath: 'app/UserSettings/SpaceMemberships.es6'
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

function reactUserBase(definition) {
  return reactStateWrapper({
    loadingText: 'Loading your account…',
    onEnter: [noop],
    ...definition
  });
}

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
  navTemplate: '<cf-profile-nav class="app-top-bar__child" />',
  children: [
    userCancellation,
    user,
    spaceMemberships,
    organizationMemberships,
    accessGrants,
    applications
  ]
});
