import { reactStateWrapper } from 'states/utils';
import NewUserBridge from 'app/OrganizationSettings/Users/NewUser/NewUserBridge';
import UserDetailRoute from 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute';
import UserListRoute from 'app/OrganizationSettings/Users/UsersList/UserListRoute';

export const inviteUsersState = reactStateWrapper({
  name: 'new',
  title: 'Invite new users',
  url: '/invite',
  component: NewUserBridge
});

export const userDetailState = reactStateWrapper({
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization user',
  url: '/organization_memberships/:userId',
  component: UserDetailRoute
});

export const usersListState = reactStateWrapper({
  name: 'list',
  title: 'Organization users',
  url: '/organization_memberships',
  component: UserListRoute
});
