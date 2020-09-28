import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { spacePlanAssignmentState } from 'features/space-plan-assignment';

export default organizationRoute({
  name: 'subscription_new',
  url: '/subscription_overview',
  children: [spacePlanAssignmentState],
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SubscriptionPageRoute }) => {
        return <SubscriptionPageRoute {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
