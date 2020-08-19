import React from 'react';
import PropTypes from 'prop-types';

import { Grid, NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { Workbench } from '@contentful/forma-36-react-components';

import { Breadcrumb } from './Breadcrumb';
import { NewSpaceFAQ } from './NewSpaceFAQ';
import { SpaceSelection } from './SpaceSelection';

const NEW_SPACE_STEPS = [
  { text: '1.Spaces', isActive: true },
  { text: '2.Payment', isActive: false },
  { text: '3.Confirmation', isActive: false },
];

export const NewSpacePage = ({ organizationId }) => {
  return (
    <Workbench>
      <Workbench.Header
        title="Space purchase"
        icon={<NavigationIcon icon="Purchase" size="large" />}
      />
      <Workbench.Content>
        <Grid columns={1} rows="repeat(3, 'auto')" columnGap="none" rowGap="spacingM">
          <Breadcrumb items={NEW_SPACE_STEPS} />
          <SpaceSelection organizationId={organizationId} />
          <NewSpaceFAQ />
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
};

NewSpacePage.propTypes = {
  organizationId: PropTypes.string,
};
