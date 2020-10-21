import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

export const upgradeSpaceState = organizationRoute({
  name: 'upgrade_space',
  url: '/upgrade_space/:spaceId',
  params: {
    spaceId: '',
  },
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ UpgradeSpaceRoute }) => {
        return <UpgradeSpaceRoute {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
