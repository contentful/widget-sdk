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

const styles = {
  card: css({ width: '100%' }),
};

export const NewOnboardingCTA = ({ spaceId }) => {
  return (
    <Card padding="large" className={styles.card}>
      <Flex justifyContent="space-between" alignItems="center">
        <div>
          <Heading>How would you like to start with Contentful?</Heading>
          <Paragraph>Choose how you want to get started with Contentful.</Paragraph>
        </div>
        <Button
          onClick={() => {
            ModalLauncher.open(({ isShown, onClose }) => {
              return (
                <FlexibleOnboardingDialog isShown={isShown} onClose={onClose} spaceId={spaceId} />
              );
            });
          }}>
          Explore
        </Button>
      </Flex>
    </Card>
  );
};
