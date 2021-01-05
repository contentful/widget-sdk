import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export const inviteUsersState = {
  name: 'new',
  url: '/invite',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ NewUserRoute }) => {
        return <NewUserRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};

export const userDetailState = {
  name: 'detail',
  params: {
    userId: '',
  },
  url: '/organization_memberships/:userId',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ UserDetailsRoute }) => {
        return <UserDetailsRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};

export const usersListState = {
  name: 'list',
  url: '/organization_memberships',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ UserListRoute }) => {
        return <UserListRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};
