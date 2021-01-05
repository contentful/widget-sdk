import React from 'react';
import { withOrganizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export const spacePlanAssignmentState = {
  name: 'space_plans',
  url: '/space_plans?spaceId,planId',
  component: withOrganizationRoute((props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SpacePlanAssignmentRoute }) => {
        return <SpacePlanAssignmentRoute {...props} />;
      }}
    </LazyLoadedComponent>
  )),
};
