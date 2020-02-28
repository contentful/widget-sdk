import { organizationRoute } from 'states/utils';
import SubscriptionPageRouter from './SubscriptionPageRouter';

export default organizationRoute({
  name: 'subscription_new',
  url: '/subscription_overview',
  component: SubscriptionPageRouter
});
