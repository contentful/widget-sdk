import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import SpacesRoute from './SpacesV1/SpacesRoute';
import AccountView from 'account/AccountView';

export const edit = {
  name: 'edit',
  url: '/edit{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => (
    <AccountView title="Organization information" icon="OrgInfo" />
  )),
};

export const subscription = {
  name: 'subscription',
  url: '/z_subscription{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <AccountView title="Subscription" icon="Subscription" />),
};

export const subscriptionBilling = {
  name: 'subscription_billing',
  url: '/subscription{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <AccountView title="Subscription" icon="Subscription" />),
};

export const spaces = {
  name: 'spaces',
  url: '/spaces',
  component: withOrganizationRoute(SpacesRoute),
};

export const offsitebackup = {
  name: 'offsitebackup',
  url: '/offsite_backup/edit{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <AccountView title="Offsite backup" />),
};

export const billing = {
  name: 'billing-gatekeeper',
  url: '/z_billing{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <AccountView title="Billing" />),
};

export const userGatekeeper = {
  name: 'gatekeeper',
  url: '/organization_memberships/{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <AccountView title="Organization users" />),
};
