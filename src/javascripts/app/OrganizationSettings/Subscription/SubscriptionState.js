import { reactStateWrapper } from 'states/utils';
import SubscriptionOverview from 'ui/Pages/SubscriptionOverview';

export default reactStateWrapper({
  name: 'subscription_new',
  url: '/subscription_overview',
  loadingText: 'Loading your subscription…',
  component: SubscriptionOverview
});
