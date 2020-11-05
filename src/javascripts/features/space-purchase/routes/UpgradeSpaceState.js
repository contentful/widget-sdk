import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';
import { SpacePurchaseContextProvider } from '../context';

export const upgradeSpaceState = organizationRoute({
  name: 'upgrade_space',
  url: '/upgrade_space/:spaceId',
  params: {
    spaceId: '',
  },
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SpacePurchaseRoute }) => {
        return (
          <SpacePurchaseContextProvider>
            <SpacePurchaseRoute {...props} />
          </SpacePurchaseContextProvider>
        );
      }}
    </LazyLoadedComponent>
  ),
});
