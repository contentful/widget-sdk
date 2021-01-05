import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

export const usageState = {
  name: 'usage',
  url: '/usage',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ OrganizationUsageRoute }) => {
        return <OrganizationUsageRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};
