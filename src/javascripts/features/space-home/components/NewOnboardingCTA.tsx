import React from 'react';
import { Heading, Paragraph, Card, Button, Flex } from '@contentful/forma-36-react-components';
import { styles } from '../styles';

export const NewOnboardingCTA: React.FC = () => {
  return (
    <Card padding="large" className={styles.card}>
      <Flex justifyContent="space-between" alignItems="center">
        <div>
          <Heading>How would you like to start with Contentful?</Heading>
          <Paragraph>Choose how you want to get started with Contentful.</Paragraph>
        </div>
        <Button>Explore</Button>
      </Flex>
    </Card>
  );
};
