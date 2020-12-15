import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { SpaceCreationContextProvider } from '../context';

export const spaceCreationState = organizationRoute({
  name: 'space_create',
  url: '/space_create',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SpaceCreationRoute }) => {
        return (
          <SpaceCreationContextProvider>
            <SpaceCreationRoute {...props} />
          </SpaceCreationContextProvider>
        );
      }}
    </LazyLoadedComponent>
  ),
});