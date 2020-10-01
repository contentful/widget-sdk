import React from 'react';
import { organizationRoute } from 'states/utils';
import { spacePlanAssignmentState } from 'features/space-plan-assignment';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { newSpaceState as spacePurchaseState } from 'features/space-purchase';
import { go } from 'states/Navigator';

const subscriptionPageState = {
  name: 'overview',
  url: '/subscription_overview',
  children: [spacePlanAssignmentState],
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SubscriptionPageRoute }) => {
        return <SubscriptionPageRoute {...props} />;
      }}
    </LazyLoadedComponent>
  ),
};

/*
  This state (account.organizations.subscription_new) originally only pointed
  to the subscription page. However, the original route was defined in such a way
  that if you wanted to add children, it would inherit the route, e.g.:
  /account/organizations/:id/subscription_overview/new_space
  This is problematic as it meant that scoping things under the "subscription" tab in the
  organization settings meant inheriting that route, which is long and annoying. To get
  around this, the original route is now a child of this one, and if we internally
  route to `account.organizations.subscription_new` it will automatically redirect
  to the overview route.
 */
export default organizationRoute({
  name: 'subscription_new',
  url: '',
  children: [spacePurchaseState, subscriptionPageState],
  component: () => {
    go({
      path: ['account', 'organizations', 'subscription_new', 'overview'],
    });
    return null;
  },
});
