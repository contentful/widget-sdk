import { reactStateWrapper } from 'states/utils.es6';

export default reactStateWrapper({
  name: 'subscription_new',
  url: '/:orgId/subscription_overview',
  loadingText: 'Loading your subscription…',
  componentPath: 'ui/Pages/SubscriptionOverview/index.es6'
});
