import React from 'react';
import { Heading, Paragraph, TextLink, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import ContentTypeIllustration from 'svg/connected-forms-illustration';
import StateLink from 'app/common/StateLink';
import { websiteUrl } from 'Config';

export default function NoContentTypeAdvice() {
  return (
    <EmptyStateContainer data-test-id="no-content-type-advice">
      <div className={defaultSVGStyle}>
        <ContentTypeIllustration />
      </div>
      <Heading>It all starts with a brilliant content model</Heading>
      <Paragraph>
        Looks like you need a content model. What’s a content model? Good question! A content model
        structures and organizes your content. It’s made up of content types— get started by adding
        the first one. Learn more in the{' '}
        <TextLink
          href={websiteUrl('developers/docs/concepts/data-model/')}
          target="_blank"
          rel="noopener noreferrer">
          content modeling documentation
        </TextLink>
      </Paragraph>
      <StateLink to="spaces.detail.content_types.new">
        {({ onClick }) => (
          <Button testId="create-content-type-empty-state" onClick={onClick}>
            Add content type
          </Button>
        )}
      </StateLink>
    </EmptyStateContainer>
  );
}
