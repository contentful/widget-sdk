import React from 'react';
import accountProfileState from './accountProfile';
import { organization } from './organization';
import { GatekeeperView } from 'account/GatekeeperView';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

const NewOrganizationRoute = () => <GatekeeperView title="Create new organization" />;

const accountState = {
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: EmptyNavigationBar,
  children: [
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

export default accountState;
