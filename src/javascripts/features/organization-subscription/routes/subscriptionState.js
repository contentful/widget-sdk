import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import { spacePlanAssignmentState } from 'features/space-plan-assignment';
import { spaceCreationState } from 'features/space-creation';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { newSpaceState, upgradeSpaceState } from 'features/space-purchase';
import { go } from 'states/Navigator';

import { importer } from './importer';

const subscriptionPageState = {
  name: 'overview',
  url: '/subscription_overview',
  children: [spacePlanAssignmentState, spaceCreationState],
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SubscriptionPageRouter }) => {
        return <SubscriptionPageRouter {...props} />;
      }}
    </LazyLoadedComponent>
  ),
};

export const subscriptionState = {
  name: 'subscription_new',
  url: '',
  children: [newSpaceState, upgradeSpaceState, subscriptionPageState],
  component: withOrganizationRoute(() => {
    go({
      path: ['account', 'organizations', 'subscription_new', 'overview'],
    });
    return null;
  }),
};
