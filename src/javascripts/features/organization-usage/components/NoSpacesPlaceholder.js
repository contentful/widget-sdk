import React from 'react';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import EmptyStateAdminIllustration from 'svg/folder-illustration.svg';
import { Heading, Paragraph, Button, TextLink } from '@contentful/forma-36-react-components';

import * as CreateSpace from 'services/CreateSpace';
import { useUsageState } from '../hooks/usageContext';

export const NoSpacesPlaceholder = () => {
  const { orgId } = useUsageState();
  return (
    <EmptyStateContainer data-test-id="usage-page__no-spaces-placeholder">
      <EmptyStateAdminIllustration className={defaultSVGStyle} />
      <Heading>Looking for your usage data?</Heading>
      <Paragraph>
        Looks like you need to create a space first. What’s a space? Good question! A space is an
        area to manage and store content for a specific project.
      </Paragraph>
      <Paragraph>
        You can learn more about spaces in the{' '}
        <TextLink
          href="https://www.contentful.com/developers/docs/concepts/domain-model/"
          target="_blank"
          rel="noopener noreferrer">
          domain model documentation
        </TextLink>
        .
      </Paragraph>
      <Button onClick={() => CreateSpace.showDialog(orgId)}>Add a space</Button>
    </EmptyStateContainer>
  );
};
