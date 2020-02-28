import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export default organizationRoute({
  name: 'invitation',
  url: '/invitations/:invitationId',
  params: {
    invitationId: ''
  },
  component: props => (
    <LazyLoadedComponent importer={importer}>
      {({ UserInvitationDetailRouter }) => {
        return <UserInvitationDetailRouter {...props} />;
      }}
    </LazyLoadedComponent>
  )
});
