import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export default organizationRoute({
  name: 'subscription_new',
  url: '/subscription_overview',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SubscriptionPageRoute }) => {
        return <SubscriptionPageRoute {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
