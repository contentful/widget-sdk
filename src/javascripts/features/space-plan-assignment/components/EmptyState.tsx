import React from 'react';
import { Typography, Heading, Paragraph, Button } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import { EmptyStateIllu } from './EmptyStateIllu';
import { salesUrl } from 'Config';
import { Flex } from '@contentful/forma-36-react-components';

export function EmptyState(props: { onBack: () => void }) {
  return (
    <EmptyStateContainer data-test-id="cf-ui-empty-state">
      <EmptyStateIllu className={defaultSVGStyle} />
      <Typography>
        <Heading>No more room?</Heading>
        <Paragraph>
          It looks like you do not have any more available spaces. Contact us to add more spaces to
          your organization.
        </Paragraph>
        <Flex alignItems="center" justifyContent="center">
          <Flex marginRight="spacingM">
            <Button
              buttonType="muted"
              icon="ChevronLeft"
              onClick={() => {
                props.onBack();
              }}>
              Go back
            </Button>
          </Flex>
          <Flex>
            <Button
              testId="get-in-touch-button"
              href={salesUrl}
              target="_blank"
              rel="noopener noreferrer">
              Get in touch
            </Button>
          </Flex>
        </Flex>
      </Typography>
    </EmptyStateContainer>
  );
}
