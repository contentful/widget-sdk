import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export default organizationRoute({
  name: 'invitations',
  url: '/invitations',
  component: props => (
    <LazyLoadedComponent importer={importer}>
      {({ UserInvitationsListRouter }) => {
        return <UserInvitationsListRouter {...props} />;
      }}
    </LazyLoadedComponent>
  )
});
