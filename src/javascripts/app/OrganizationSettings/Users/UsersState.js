import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export const inviteUsersState = organizationRoute({
  name: 'new',
  url: '/invite',
  component: props => (
    <LazyLoadedComponent importer={importer}>
      {({ NewUserRoute }) => {
        return <NewUserRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )
});

export const userDetailState = organizationRoute({
  name: 'detail',
  params: {
    userId: ''
  },
  url: '/organization_memberships/:userId',
  component: props => (
    <LazyLoadedComponent importer={importer}>
      {({ UserDetailsRoute }) => {
        return <UserDetailsRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )
});

export const usersListState = organizationRoute({
  name: 'list',
  url: '/organization_memberships',
  component: props => (
    <LazyLoadedComponent importer={importer}>
      {({ UserListRoute }) => {
        return <UserListRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )
});
