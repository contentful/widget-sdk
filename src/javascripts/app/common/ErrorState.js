import React from 'react';
import { Typography, Heading, Paragraph } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import BrokenPencil from 'svg/broken-pencil';

export default function ErrorState() {
  return (
    <EmptyStateContainer data-test-id="cf-ui-error-state">
      <BrokenPencil className={defaultSVGStyle} />
      <Typography>
        <Heading>Something went wrong</Heading>
        <Paragraph>Reload the page, or get in touch with us if the issue persists.</Paragraph>
      </Typography>
    </EmptyStateContainer>
  );
}
