import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export default organizationRoute({
  name: 'usage',
  url: '/usage',
  component: props => (
    <LazyLoadedComponent importer={importer}>
      {({ OrganizationUsage }) => {
        return <OrganizationUsage {...props} />;
      }}
    </LazyLoadedComponent>
  )
});
