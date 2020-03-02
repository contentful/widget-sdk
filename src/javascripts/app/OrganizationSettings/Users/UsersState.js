import { organizationRoute } from 'states/utils';
import NewUserRoute from 'app/OrganizationSettings/Users/NewUser/NewUserRoute';
import UserDetailsRoute from 'app/OrganizationSettings/Users/UserDetail/UserDetailsRoute';
import UserListRoute from 'app/OrganizationSettings/Users/UsersList/UserListRoute';

export const inviteUsersState = organizationRoute({
  name: 'new',
  url: '/invite',
  component: NewUserRoute
});

export const userDetailState = organizationRoute({
  name: 'detail',
  params: {
    userId: ''
  },
  url: '/organization_memberships/:userId',
  component: UserDetailsRoute
});

export const usersListState = organizationRoute({
  name: 'list',
  url: '/organization_memberships',
  component: UserListRoute
});
