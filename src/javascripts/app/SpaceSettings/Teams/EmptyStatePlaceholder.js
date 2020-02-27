import React from 'react';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';

import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/illustrations/add-team-to-space-illustration.svg';

export default () => (
  <EmptyStateContainer data-test-id="no-teams-in-space-placeholder">
    <div className={defaultSVGStyle}>
      <Illustration />
    </div>
    <Heading>Add a team to this space</Heading>
    <Paragraph>
      The team feature brings greater visibility and management to the web app. Everyone in a team
      can see their teammates, and a space admin can assign roles to a full team.
    </Paragraph>
  </EmptyStateContainer>
);
