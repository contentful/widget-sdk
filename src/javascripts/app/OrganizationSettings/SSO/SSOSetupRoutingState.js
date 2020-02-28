import React from 'react';
import { organizationRoute } from 'states/utils';

import LazyLoadedComponent from 'app/common/LazyLoadedComponent';

const SSOSetupImporter = async () =>
  (await import(/* webpackChunkName: "SSOSetup" */ 'app/OrganizationSettings/SSO/SSOSetup'))
    .default;

export default organizationRoute({
  name: 'sso',
  url: '/sso',
  component: props => (
    <LazyLoadedComponent importer={SSOSetupImporter}>
      {SSOSetup => {
        return <SSOSetup {...props} />;
      }}
    </LazyLoadedComponent>
  )
});
