import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import { SpacePurchaseRoute } from './SpacePurchaseRoute';
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
    <SpacePurchaseContextProvider>
      <SpacePurchaseRoute {...props} />
    </SpacePurchaseContextProvider>
  )),
};
