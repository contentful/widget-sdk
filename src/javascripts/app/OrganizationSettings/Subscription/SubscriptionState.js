import { reactStateWrapper } from 'states/utils';
import SubscriptionPageRouter from './SubscriptionPageRouter';

export default reactStateWrapper({
  name: 'subscription_new',
  url: '/subscription_overview',
  loadingText: 'Loading your subscription…',
  component: SubscriptionPageRouter
});
