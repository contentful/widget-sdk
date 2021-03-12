import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';
import { SpacePurchaseContextProvider } from '../context';

export const upgradeSpaceState = {
  name: 'upgrade_space',
  url: '/upgrade_space/:spaceId',
  params: {
    spaceId: '',
    from: '',
    preselect: '',
  },
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SpacePurchaseRoute }) => {
        return (
          <SpacePurchaseContextProvider>
            <SpacePurchaseRoute {...props} />
          </SpacePurchaseContextProvider>
        );
      }}
    </LazyLoadedComponent>
  )),
};
