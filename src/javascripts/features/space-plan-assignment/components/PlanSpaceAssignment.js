import React from 'react';
import PropTypes from 'prop-types';
import { Workbench } from '@contentful/forma-36-react-components';
import { NavigationIcon, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Breadcrumbs } from 'features/breadcrumbs';

const ASSIGNMENT_STEPS = [
  { text: '1.Choose space', isActive: true },
  { text: '2.Confirm', isActive: false },
];

export function PlanSpaceAssignment({ orgId, planId }) {
  return (
    <Workbench>
      <Workbench.Header
        title="Subscription"
        icon={<NavigationIcon icon="Subscription" size="large" />}
      />
      <Workbench.Content>
        <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
          <Breadcrumbs items={ASSIGNMENT_STEPS} isActive={ASSIGNMENT_STEPS[0]} />
          {`I will be displaing list of spaces from org: ${orgId} that can be assign to the plan - ${planId}`}
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
}

PlanSpaceAssignment.propTypes = {
  orgId: PropTypes.string.isRequired,
  planId: PropTypes.string.isRequired,
};
