import { reactStateWrapper } from 'states/utils';

export const inviteUsersState = reactStateWrapper({
  name: 'new',
  title: 'Invite new users',
  url: '/invite',
  componentPath: 'app/OrganizationSettings/Users/NewUser/NewUserBridge'
});

export const userDetailState = reactStateWrapper({
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization user',
  url: '/organization_memberships/:userId',
  componentPath: 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute'
});

export const usersListState = reactStateWrapper({
  name: 'list',
  title: 'Organization users',
  url: '/organization_memberships',
  componentPath: 'app/OrganizationSettings/Users/UsersList/UserListRoute'
});
