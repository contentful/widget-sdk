import React from 'react';
import { css } from 'emotion';
import {
  Card,
  Typography,
  Paragraph,
  Heading,
  Button,
} from '@contentful/forma-36-react-components';
import { ReactRouterLink } from 'core/react-routing';

import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import EmptyStateAdminIllustration from 'svg/folder-illustration.svg';

const styles = { illustration: css({ width: '150px' }) };

export function OrgMembershipsSection() {
  return (
    <Card testId="org-memberships-section-card" padding="large">
      <Typography>
        <EmptyStateContainer>
          <EmptyStateAdminIllustration className={styles.illustration} />
          <Heading>Starting something new?</Heading>
          <Paragraph>
            It seems like you’re not a member of any organization in Contentful.
          </Paragraph>
          <ReactRouterLink component={Button} route={{ path: 'account.new_organization' }}>
            Create a new organization
          </ReactRouterLink>
        </EmptyStateContainer>
      </Typography>
    </Card>
  );
}
