import React from 'react';
import { reactStateWrapper } from 'states/utils';

import LazyLoadedComponent from 'app/common/LazyLoadedComponent';

const importer = async () =>
  (await import(/* webpackChunkName: "SSOSetup" */ 'app/OrganizationSettings/SSO/SSOSetup'))
    .default;

export default reactStateWrapper({
  name: 'sso',
  url: '/sso',
  component: props => <LazyLoadedComponent importer={importer} {...props} />
});
