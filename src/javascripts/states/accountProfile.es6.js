import _ from 'lodash';
import base from 'states/Base.es6';

const user = userBase({
  name: 'user',
  title: 'User settings',
  url: '/user{pathSuffix:PathSuffix}'
});

const spaceMemberships = userBase({
  name: 'space_memberships',
  title: 'Space memberships',
  url: '/space_memberships{pathSuffix:PathSuffix}'
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
  const defaults = {
    label: 'Account',
    params: {
      pathSuffix: ''
    },
    template: `
      <div class="workbench-header__wrapper">
        <header class="workbench-header">
          <h1 class="workbench-header__title">${definition.title}</h1>
        </header>
      </div>
      <cf-account-view context="context"></cf-account-view>
    `.trim()
  };

  return base(Object.assign({}, definition, defaults));
}

export default base({
  name: 'profile',
  url: '/profile',
  abstract: true,
  views: {
    'nav-bar@': {
      template: '<cf-profile-nav class="app-top-bar__child"></cf-profile-nav>'
    }
  },
  children: [
    userCancellation,
    user,
    spaceMemberships,
    organizationMemberships,
    accessGrants,
    applications
  ]
});
