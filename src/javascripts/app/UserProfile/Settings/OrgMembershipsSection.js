import React from 'react';
import { Typography, Paragraph, Heading, Button } from '@contentful/forma-36-react-components';
import EmptyStateAdminIllustration from 'svg/folder-illustration';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { css } from 'emotion';

const styles = { illustration: css({ width: '150px' }) };

export function OrgMembershipsSection() {
  return (
    <Typography>
      <EmptyStateContainer>
        <EmptyStateAdminIllustration className={styles.illustration} />
        <Heading>Starting something new?</Heading>
        <Paragraph>It seems like you are not a member of any organization in Contentful.</Paragraph>
        <Button href="/account/organizations/new">Create a new organization</Button>
      </EmptyStateContainer>
    </Typography>
  );
}
