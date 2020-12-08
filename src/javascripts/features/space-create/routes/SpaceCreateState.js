import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { SpaceCreateContextProvider } from '../context';

export const spaceCreateState = organizationRoute({
  name: 'space_create',
  url: '/space_create',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SpaceCreateRoute }) => {
        return (
          <SpaceCreateContextProvider>
            <SpaceCreateRoute {...props} />
          </SpaceCreateContextProvider>
        );
      }}
    </LazyLoadedComponent>
  ),
});
