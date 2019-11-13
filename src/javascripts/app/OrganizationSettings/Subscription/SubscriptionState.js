import { reactStateWrapper } from 'states/utils';

export default reactStateWrapper({
  name: 'subscription_new',
  url: '/subscription_overview',
  loadingText: 'Loading your subscription…',
  componentPath: 'ui/Pages/SubscriptionOverview'
});
