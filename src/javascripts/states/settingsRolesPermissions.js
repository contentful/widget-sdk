import React from 'react';
import { RoleEditorRoute, RolesListRoute } from 'features/roles-permissions-management';

const list = {
  name: 'list',
  url: '',
  component: RolesListRoute,
};

export const RoleEditRoutes = {
  Details: {
    name: 'details',
    url: 'details',
    label: 'Role detail',
  },
  Content: {
    name: 'content',
    url: 'content',
    label: 'Content',
  },
  Media: {
    name: 'media',
    url: 'media',
    label: 'Media',
  },
  Permissions: {
    name: 'permissions',
    url: 'permissions',
    label: 'Permissions',
  },
};

const newRole = {
  name: 'new',
  url: '/new?{tab:string}',
  params: {
    baseRoleId: null,
    tab: {
      value: RoleEditRoutes.Details.url,
    },
  },
  component: (props) => <RoleEditorRoute {...props} isNew={true} />,
};

const detail = {
  name: 'detail',
  url: '/:roleId?{tab:string}',
  params: {
    tab: {
      value: RoleEditRoutes.Details.url,
    },
  },
  component: (props) => <RoleEditorRoute {...props} isNew={false} />,
};

export const rolesPermissionsSettingsState = {
  name: 'roles',
  url: '/roles',
  abstract: true,
  children: [newRole, detail, list],
};
