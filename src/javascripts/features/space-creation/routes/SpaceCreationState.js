import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import { SpaceCreationRoute } from 'features/space-creation';
import { SpaceCreationContextProvider } from '../context';

export const spaceCreationState = {
  name: 'space_create',
  url: '/space_create?planId',
  component: withOrganizationRoute((props) => (
    <SpaceCreationContextProvider>
      <SpaceCreationRoute {...props} />
    </SpaceCreationContextProvider>
  )),
};
