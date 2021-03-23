import React from 'react';
import { css } from 'emotion';
import {
  Card,
  Typography,
  Paragraph,
  Heading,
  Button,
} from '@contentful/forma-36-react-components';

import { go } from 'states/Navigator';
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
          <Button onClick={() => go({ path: ['account', 'new_organization'] })}>
            Create a new organization
          </Button>
        </EmptyStateContainer>
      </Typography>
    </Card>
  );
}
