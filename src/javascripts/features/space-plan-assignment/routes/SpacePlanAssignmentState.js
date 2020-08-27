import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

export const spacePlanAssignmentState = organizationRoute({
  name: 'space_plans',
  url: '/space_plans?spaceId',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ SpacePlanAssignmentRoute }) => {
        return <SpacePlanAssignmentRoute {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
