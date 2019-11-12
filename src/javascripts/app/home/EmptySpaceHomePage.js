import React from 'react';
import { Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/readonly-space-ill';

const EmptySpaceHomePage = () => {
  return (
    <EmptyStateContainer>
      <Illustration className={defaultSVGStyle} />
      <Typography>
        <Heading>Waiting for space access?</Heading>
        <Paragraph>
          You currently don’t have access to any spaces.
          <br />
          Talk with your organization admin to access a space.
        </Paragraph>
      </Typography>
    </EmptyStateContainer>
  );
};

export default EmptySpaceHomePage;
