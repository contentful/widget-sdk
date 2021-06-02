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
import tokens from '@contentful/forma-36-tokens';

const styles = {
  card: css({ width: '100%' }),
  heading: css({ marginBottom: tokens.spacingS }),
};

export const DiscoverOnboardingCTA = ({ spaceId }) => {
  return (
    <Card padding="large" className={styles.card}>
      <Flex justifyContent="space-between" alignItems="center">
        <div>
          <Heading className={styles.heading}>
            Do you want to discover Contentful in a different way?
          </Heading>
          <Paragraph>Choose from different ways to get started with Contentful.</Paragraph>
        </div>
        <Button
          testId="discover-onboarding-btn"
          onClick={() => {
            track('space_home:onboarding_discover');
            ModalLauncher.open(({ isShown, onClose }) => {
              return (
                <FlexibleOnboardingDialog
                  isShown={isShown}
                  onClose={onClose}
                  spaceId={spaceId}
                  replaceSpace={true}
                />
              );
            });
          }}>
          Discover
        </Button>
      </Flex>
    </Card>
  );
};
