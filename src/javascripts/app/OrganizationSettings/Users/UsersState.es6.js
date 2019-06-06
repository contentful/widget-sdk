import { reactStateWrapper } from 'app/routeUtils.es6';

export const inviteUsersState = reactStateWrapper({
  name: 'new',
  title: 'Invite new users',
  url: '/:orgId/invite',
  componentPath: 'app/OrganizationSettings/Users/NewUser/NewUserBridge.es6'
});

export const userDetailState = reactStateWrapper({
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization user',
  url: '/:orgId/organization_memberships/:userId',
  componentPath: 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute.es6'
});

export const usersListState = reactStateWrapper({
  name: 'list',
  title: 'Organization users',
  url: '/:orgId/organization_memberships',
  componentPath: 'app/OrganizationSettings/Users/UsersList/UserListRoute.es6'
});
