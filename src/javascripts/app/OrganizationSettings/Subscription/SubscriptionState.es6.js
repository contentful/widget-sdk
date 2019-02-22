import { reactStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export default reactStateWrapper({
  name: 'subscription_new',
  url: '/:orgId/subscription_overview',
  label: 'Subscription',
  componentPath: 'ui/Pages/SubscriptionOverview/index.es6'
});
