import React from 'react';
import { css } from 'emotion';
import { Heading, Paragraph, TextLink } from '@contentful/forma-36-react-components';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import BinocularsIllustration from 'svg/binoculars-illustration.svg';
import { websiteUrl } from 'Config';

const styles = { svgContainer: css({ width: '30vw' }) };

export default function NoSearchResultsAdvice() {
  return (
    <EmptyStateContainer data-test-id="no-search-results-empty-state">
      <div className={styles.svgContainer}>
        <BinocularsIllustration />
      </div>
      <Heading>No search results?</Heading>
      <Paragraph>
        Try a different search term or filter.{' '}
        <TextLink
          href={websiteUrl('/r/knowledgebase/content-search/')}
          target="_blank"
          rel="noopener noreferrer">
          Here’s how search works
        </TextLink>
      </Paragraph>
    </EmptyStateContainer>
  );
}
