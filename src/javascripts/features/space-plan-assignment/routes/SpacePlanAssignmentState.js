import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { SpacePlanAssignmentRoute } from 'features/space-plan-assignment';

export const spacePlanAssignmentState = {
  name: 'space_plans',
  url: '/space_plans?spaceId,planId',
  component: withOrganizationRoute((props) => <SpacePlanAssignmentRoute {...props} />),
};
