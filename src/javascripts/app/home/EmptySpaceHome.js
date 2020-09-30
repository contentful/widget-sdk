import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, Typography, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import * as CreateSpace from 'services/CreateSpace';
import Illustration from 'svg/illustrations/readonly-space-home-ill.svg';
import EmptyStateAdminIllustration from 'svg/folder-illustration.svg';

const EmptySpaceHomePage = ({ orgId, orgOwnerOrAdmin }) => {
  return orgOwnerOrAdmin ? (
    <EmptyStateContainer data-test-id="cf-ui-empty-space-admin">
      <EmptyStateAdminIllustration className={defaultSVGStyle} />
      <Heading>Starting something new?</Heading>
      <Paragraph>A space is an area to manage and store content for a specific project.</Paragraph>
      <Button onClick={() => CreateSpace.beginSpaceCreation(orgId)}>Add a space</Button>
    </EmptyStateContainer>
  ) : (
    <EmptyStateContainer data-test-id="cf-ui-empty-space">
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

EmptySpaceHomePage.propTypes = {
  orgId: PropTypes.string,
  orgOwnerOrAdmin: PropTypes.bool,
};

export default EmptySpaceHomePage;
