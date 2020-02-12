import { reactStateWrapper } from 'states/utils';
import NewUserRoute from 'app/OrganizationSettings/Users/NewUser/NewUserRoute';
import UserDetailsRoute from 'app/OrganizationSettings/Users/UserDetail/UserDetailsRoute';
import UserListRoute from 'app/OrganizationSettings/Users/UsersList/UserListRoute';

export const inviteUsersState = reactStateWrapper({
  name: 'new',
  title: 'Invite new users',
  url: '/invite',
  component: NewUserRoute
});

export const userDetailState = reactStateWrapper({
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization user',
  url: '/organization_memberships/:userId',
  component: UserDetailsRoute
});

export const usersListState = reactStateWrapper({
  name: 'list',
  title: 'Organization users',
  url: '/organization_memberships',
  component: UserListRoute
});
