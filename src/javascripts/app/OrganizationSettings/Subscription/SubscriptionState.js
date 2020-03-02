import { organizationRoute } from 'states/utils';
import SubscriptionPageRoute from 'ui/Pages/SubscriptionOverview';

export default organizationRoute({
  name: 'subscription_new',
  url: '/subscription_overview',
  component: SubscriptionPageRoute
});
