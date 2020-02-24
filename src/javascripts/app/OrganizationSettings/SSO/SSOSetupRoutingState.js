import React from 'react';
import { reactStateWrapper } from 'states/utils';

import LazyLoadedComponent from 'app/common/LazyLoadedComponent';

const SSOSetupImporter = async () =>
  (await import(/* webpackChunkName: "SSOSetup" */ 'app/OrganizationSettings/SSO/SSOSetup'))
    .default;

export default reactStateWrapper({
  name: 'sso',
  url: '/sso',
  // eslint-disable-next-line
  component: ({ onReady, ...props }) => (
    <LazyLoadedComponent onReady={onReady} importer={SSOSetupImporter}>
      {SSOSetup => {
        return <SSOSetup {...props} />;
      }}
    </LazyLoadedComponent>
  )
});
