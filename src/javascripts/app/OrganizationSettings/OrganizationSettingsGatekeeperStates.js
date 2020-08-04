import { iframeStateWrapper } from 'states/utils';
import SpacesRoute from './SpacesV1/SpacesRoute';

const edit = {
  name: 'edit',
  title: 'Organization information',
  icon: 'OrgInfo',
  url: '/edit{pathSuffix:PathSuffix}',
};

const subscription = {
  name: 'subscription',
  title: 'Subscription',
  icon: 'Subscription',
  url: '/z_subscription{pathSuffix:PathSuffix}',
};

const subscriptionBilling = {
  name: 'subscription_billing',
  title: 'Subscription',
  icon: 'Subscription',
  url: '/subscription{pathSuffix:PathSuffix}',
};

const spaces = {
  name: 'spaces',
  url: '/spaces',
  component: SpacesRoute,
};

const offsitebackup = {
  name: 'offsitebackup',
  title: 'Offsite backup',
  url: '/offsite_backup/edit{pathSuffix:PathSuffix}',
};

const billing = {
  name: 'billing-iframe',
  title: 'Billing',
  url: '/z_billing{pathSuffix:PathSuffix}',
};

const userGatekeeper = {
  name: 'gatekeeper',
  title: 'Organization users',
  url: '/organization_memberships/{pathSuffix:PathSuffix}',
};

export default [offsitebackup, billing, edit, subscription, subscriptionBilling, userGatekeeper]
  .map(iframeStateWrapper)
  // The following routes were already migrated to UI
  .concat([spaces]);
