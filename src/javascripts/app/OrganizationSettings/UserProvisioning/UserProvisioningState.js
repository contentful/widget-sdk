import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export default organizationRoute({
  name: 'user-provisioning',
  url: '/user_provisioning',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ UserProvisioning }) => {
        return <UserProvisioning {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
