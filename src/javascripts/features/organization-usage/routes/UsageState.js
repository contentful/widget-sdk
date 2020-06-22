import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

export const usageState = organizationRoute({
  name: 'usage',
  url: '/usage',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ OrganizationUsageRoute }) => {
        return <OrganizationUsageRoute {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
