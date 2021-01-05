import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export const SSOSetupRoutingState = {
  name: 'sso',
  url: '/sso',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SSOSetup }) => {
        return <SSOSetup {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};
