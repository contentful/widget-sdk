import React from 'react';
import { Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon, Grid } from '@contentful/forma-36-react-components/dist/alpha';
import { Breadcrumbs } from 'features/breadcrumbs';

const CREATE_SPACE_STEPS = [
  { text: '1.Choose space type', isActive: true },
  { text: '2.Enter space details', isActive: false },
  { text: '3.Confirm', isActive: false },
];

export const SpaceCreate = () => {
  return (
    <Workbench>
      <Workbench.Header
        title="Subscription"
        icon={<ProductIcon icon="Subscription" size="large" />}
      />
      <Workbench.Content>
        <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
          <Breadcrumbs items={CREATE_SPACE_STEPS} />
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
};
