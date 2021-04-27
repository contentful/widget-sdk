import React from 'react';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { withOrganizationRoute } from 'states/utils';
import { GatekeeperView } from 'account/GatekeeperView';

export const edit = {
  name: 'edit',
  url: '/edit{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => (
    <GatekeeperView
      title="Organization information"
      icon={<ProductIcon size="large" icon="OrgInfo" />}
    />
  )),
};

export const subscription = {
  name: 'subscription',
  url: '/z_subscription{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => (
    <GatekeeperView title="Subscription" icon={<ProductIcon size="large" icon="Subscription" />} />
  )),
};

export const subscriptionBilling = {
  name: 'subscription_billing',
  url: '/subscription{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => (
    <GatekeeperView title="Subscription" icon={<ProductIcon size="large" icon="Subscription" />} />
  )),
};

export const offsitebackup = {
  name: 'offsitebackup',
  url: '/offsite_backup/edit{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <GatekeeperView title="Offsite backup" />),
};

export const billing = {
  name: 'billing-gatekeeper',
  url: '/z_billing{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <GatekeeperView title="Billing" />),
};

export const userGatekeeper = {
  name: 'gatekeeper',
  url: '/organization_memberships/{pathSuffix:PathSuffix}',
  params: {
    pathSuffix: '',
  },
  component: withOrganizationRoute(() => <GatekeeperView title="Organization users" />),
};
