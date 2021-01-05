import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { SpaceCreationContextProvider } from '../context';

export const spaceCreationState = {
  name: 'space_create',
  url: '/space_create?planId',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SpaceCreationRoute }) => {
        return (
          <SpaceCreationContextProvider>
            <SpaceCreationRoute {...props} />
          </SpaceCreationContextProvider>
        );
      }}
    </LazyLoadedComponent>
  )),
};
