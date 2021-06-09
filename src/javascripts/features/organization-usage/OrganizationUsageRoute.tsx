import React from 'react';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

export const OrganizationUsageRoute = (props: { orgId: string }) => (
  <LazyLoadedComponent importer={importer}>
    {({ OrganizationUsagePage }) => {
      return <OrganizationUsagePage {...props} />;
    }}
  </LazyLoadedComponent>
);
