import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';
import { SpacePurchaseContextProvider } from '../context';

export const newSpaceState = {
  name: 'new_space',
  url: '/new_space?{from:string}',
  params: {
    from: '',
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
