import React from 'react';
import {
  Heading,
  Paragraph,
  Card,
  Button,
  Flex,
  ModalLauncher,
} from '@contentful/forma-36-react-components';
import { FlexibleOnboardingDialog } from './FlexibleOnboardingDialog';
import { css } from 'emotion';
import { track } from 'analytics/Analytics';

const styles = {
  card: css({ width: '100%' }),
};

export const DiscoverOnboardingCTA = ({ spaceId }) => {
  return (
    <Card padding="large" className={styles.card}>
      <Flex justifyContent="space-between" alignItems="center">
        <div>
          <Heading>Do you want to discover Contentful in a different way?</Heading>
          <Paragraph>Choose from different ways to get started with Contentful.</Paragraph>
        </div>
        <Button
          testId="discover-onboarding-btn"
          onClick={() => {
            track('space_home:onboarding_discover');
            ModalLauncher.open(({ isShown, onClose }) => {
              return (
                <FlexibleOnboardingDialog isShown={isShown} onClose={onClose} spaceId={spaceId} />
              );
            });
          }}>
          Discover
        </Button>
      </Flex>
    </Card>
  );
};
