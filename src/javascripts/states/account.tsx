import React from 'react';
import accountProfileState from './accountProfile';
import {
  organizationSettings,
  organization,
} from 'app/OrganizationSettings/OrganizationSettingsState';
import { GatekeeperView } from 'account/GatekeeperView';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

const NewOrganizationRoute = () => <GatekeeperView title="Create new organization" />;

export default {
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: EmptyNavigationBar,
  children: [
    organizationSettings,
    {
      name: 'new_organization',
      url: '/organizations/new',
      navComponent: EmptyNavigationBar,
      component: NewOrganizationRoute,
    },
    organization,
    accountProfileState,
  ],
};
