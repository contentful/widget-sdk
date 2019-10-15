import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, Typography, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import * as CreateSpace from 'services/CreateSpace.es6';
import Illustration from 'svg/readonly-space-home-ill.es6';
import EmptyStateAdminIllustration from 'svg/folder-illustration.es6';

const EmptySpaceHomePage = ({ lastUsedOrg, orgOwnerOrAdmin }) => {
  return orgOwnerOrAdmin ? (
    <EmptyStateContainer>
      <EmptyStateAdminIllustration className={defaultSVGStyle} />
      <Heading>Starting something new?</Heading>
      <Paragraph>A space is an area to manage and store content for a specific project.</Paragraph>
      <Button onClick={() => CreateSpace.showDialog(lastUsedOrg)}>Add a space</Button>
    </EmptyStateContainer>
  ) : (
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

EmptySpaceHomePage.propTypes = {
  lastUsedOrg: PropTypes.string,
  orgOwnerOrAdmin: PropTypes.bool
};

export default EmptySpaceHomePage;