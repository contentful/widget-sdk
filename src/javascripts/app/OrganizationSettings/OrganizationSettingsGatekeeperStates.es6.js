import { iframeStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

const newOrg = {
  name: 'new',
  url: '/new',
  label: 'Create new organization',
  views: {
    // Override organization navbar from the parent state
    'nav-bar@': { template: '' }
  }
};

const edit = {
  name: 'edit',
  title: 'Organization information',
  url: '/:orgId/edit{pathSuffix:PathSuffix}'
};

const subscription = {
  name: 'subscription',
  title: 'Subscription',
  url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
};

const subscriptionBilling = {
  name: 'subscription_billing',
  title: 'Subscription',
  url: '/:orgId/subscription{pathSuffix:PathSuffix}',
  hideHeader: true
};

const spaces = {
  name: 'spaces',
  title: 'Organization spaces',
  url: '/:orgId/spaces{pathSuffix:PathSuffix}'
};

const offsitebackup = {
  name: 'offsitebackup',
  title: 'Offsite backup',
  url: '/:orgId/offsite_backup/edit{pathSuffix:PathSuffix}'
};

const billing = {
  name: 'billing',
  title: 'Billing',
  url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
};

const userGatekeeper = {
  name: 'gatekeeper',
  title: 'Organization users',
  url: '/:orgId/organization_memberships/{pathSuffix:PathSuffix}'
};

export default [
  newOrg,
  spaces,
  offsitebackup,
  billing,
  edit,
  subscription,
  subscriptionBilling,
  userGatekeeper
].map(iframeStateWrapper);
