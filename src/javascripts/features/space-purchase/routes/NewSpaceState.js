import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';
import { SpacePurchaseContextProvider } from '../context';

export const newSpaceState = organizationRoute({
  name: 'new_space',
  url: '/new_space',
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
