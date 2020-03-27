import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export default organizationRoute({
  name: 'sso',
  url: '/sso',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SSOSetup }) => {
        return <SSOSetup {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
