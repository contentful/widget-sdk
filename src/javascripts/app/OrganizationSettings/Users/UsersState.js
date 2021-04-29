import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import { NewUserRoute, UserDetailsRoute, UserListRoute } from 'app/OrganizationSettings';

export const inviteUsersState = {
  name: 'new',
  url: '/invite',
  component: withOrganizationRoute((props) => <NewUserRoute {...props} />),
};

export const userDetailState = {
  name: 'detail',
  params: {
    userId: '',
  },
  url: '/organization_memberships/:userId',
  component: withOrganizationRoute((props) => <UserDetailsRoute {...props} />),
};

export const usersListState = {
  name: 'list',
  url: '/organization_memberships',
  component: withOrganizationRoute((props) => <UserListRoute {...props} />),
};
