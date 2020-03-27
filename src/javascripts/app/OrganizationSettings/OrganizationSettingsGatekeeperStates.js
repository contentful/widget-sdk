import { iframeStateWrapper } from 'states/utils';

const edit = {
  name: 'edit',
  title: 'Organization information',
  icon: 'org-info',
  url: '/edit{pathSuffix:PathSuffix}',
};

const subscription = {
  name: 'subscription',
  title: 'Subscription',
  icon: 'subscription',
  url: '/z_subscription{pathSuffix:PathSuffix}',
};

const subscriptionBilling = {
  name: 'subscription_billing',
  title: 'Subscription',
  icon: 'subscription',
  url: '/subscription{pathSuffix:PathSuffix}',
};

const spaces = {
  name: 'spaces',
  title: 'Organization spaces',
  icon: 'spaces',
  url: '/spaces{pathSuffix:PathSuffix}',
};

const offsitebackup = {
  name: 'offsitebackup',
  title: 'Offsite backup',
  url: '/offsite_backup/edit{pathSuffix:PathSuffix}',
};

const billing = {
  name: 'billing',
  title: 'Billing',
  url: '/z_billing{pathSuffix:PathSuffix}',
};

const userGatekeeper = {
  name: 'gatekeeper',
  title: 'Organization users',
  url: '/organization_memberships/{pathSuffix:PathSuffix}',
};

export default [
  spaces,
  offsitebackup,
  billing,
  edit,
  subscription,
  subscriptionBilling,
  userGatekeeper,
].map(iframeStateWrapper);
