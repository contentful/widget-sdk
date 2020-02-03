import { reactStateWrapper } from 'states/utils';
import NewUser from 'app/OrganizationSettings/Users/NewUser/NewUser';
import UserDetailRoute from 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute';
import UserListRoute from 'app/OrganizationSettings/Users/UsersList/UserListRoute';

export const inviteUsersState = reactStateWrapper({
  name: 'new',
  title: 'Invite new users',
  url: '/invite',
  component: NewUser
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
