import { iframeStateWrapper } from 'states/utils.es6';

const edit = {
  name: 'edit',
  title: 'Organization information',
  url: '/edit{pathSuffix:PathSuffix}'
};

const subscription = {
  name: 'subscription',
  title: 'Subscription',
  url: '/z_subscription{pathSuffix:PathSuffix}'
};

const subscriptionBilling = {
  name: 'subscription_billing',
  title: 'Subscription',
  url: '/subscription{pathSuffix:PathSuffix}'
};

const spaces = {
  name: 'spaces',
  title: 'Organization spaces',
  url: '/spaces{pathSuffix:PathSuffix}'
};

const offsitebackup = {
  name: 'offsitebackup',
  title: 'Offsite backup',
  url: '/offsite_backup/edit{pathSuffix:PathSuffix}'
};

const billing = {
  name: 'billing',
  title: 'Billing',
  url: '/z_billing{pathSuffix:PathSuffix}'
};

const userGatekeeper = {
  name: 'gatekeeper',
  title: 'Organization users',
  url: '/organization_memberships/{pathSuffix:PathSuffix}'
};

export default [
  spaces,
  offsitebackup,
  billing,
  edit,
  subscription,
  subscriptionBilling,
  userGatekeeper
].map(iframeStateWrapper);
