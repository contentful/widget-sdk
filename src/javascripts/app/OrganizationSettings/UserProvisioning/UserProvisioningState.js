import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export default {
  name: 'user-provisioning',
  url: '/user_provisioning',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ UserProvisioning }) => {
        return <UserProvisioning {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};
