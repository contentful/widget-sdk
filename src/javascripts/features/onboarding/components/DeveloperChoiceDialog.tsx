import React, { useState } from 'react';
import {
  Button,
  Card,
  DisplayText,
  Modal,
  Tag,
  Grid,
  Subheading,
  TextLink,
  Flex,
  Paragraph,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { track } from 'analytics/Analytics';
import * as Config from 'Config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  tag: css({
    marginBottom: tokens.spacingS,
  }),
  header: css({
    marginBottom: tokens.spacingXs,
  }),
  subheading: css({
    marginBottom: tokens.spacingM,
  }),
};

const withInAppOnboardingUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'onboarding-developer-choice',
  campaign: 'in-app-help',
});

export enum Choices {
  GATSBY_BLOG_OPTION = 'gatsby-blog',
  SAMPLE_SPACE_OPTION = 'sample-space',
  EMPTY_SPACE_OPTION = 'empty-space',
}

export const DeveloperChoiceDialog = ({ onContinue }) => {
  const [choice, setChoice] = useState<Choices>();

  const learningLink = withInAppOnboardingUtmParams('https://training.contentful.com/');
  const docsLink = withInAppOnboardingUtmParams(Config.developerDocsUrl);

  return (
    <Modal.Content testId="developer-choice-modal">
      <Flex marginBottom="spacing3Xl" flexDirection="column">
        <DisplayText className={styles.header}>How would you like to start?</DisplayText>
        <Paragraph>You can change your choice at any time.</Paragraph>
      </Flex>
      <Flex marginBottom="spacing3Xl">
        <Grid columnGap="spacingXl" columns={3} flow="row" rowGap="none" rows={1}>
          <Card
            testId={Choices.EMPTY_SPACE_OPTION}
            padding="large"
            selected={choice == Choices.EMPTY_SPACE_OPTION}
            onClick={() => setChoice(Choices.EMPTY_SPACE_OPTION)}>
            <Tag tagType="primary" className={styles.tag}>
              NO CODE
            </Tag>
            <Subheading className={styles.subheading}>Use blank space</Subheading>
            <Paragraph>Build it your way from scratch.</Paragraph>
          </Card>
          <Card
            testId={Choices.SAMPLE_SPACE_OPTION}
            padding="large"
            selected={choice == Choices.SAMPLE_SPACE_OPTION}
            onClick={() => setChoice(Choices.SAMPLE_SPACE_OPTION)}>
            <Tag tagType="primary" className={styles.tag}>
              NO CODE
            </Tag>
            <Subheading className={styles.subheading}>Use pre-built space</Subheading>
            <Paragraph>Place content into a sample space.</Paragraph>
          </Card>
          <Card
            testId={Choices.GATSBY_BLOG_OPTION}
            padding="large"
            selected={choice == Choices.GATSBY_BLOG_OPTION}
            onClick={() => setChoice(Choices.GATSBY_BLOG_OPTION)}>
            <Tag tagType="secondary" className={styles.tag}>
              CODE
            </Tag>
            <Subheading className={styles.subheading}>Use APIs</Subheading>
            <Paragraph>Create a space with our code sample.</Paragraph>
          </Card>
        </Grid>
      </Flex>
      <Flex justifyContent="space-between" marginBottom="spacingM">
        <Flex flexDirection="column">
          <TextLink
            testId="developer-docs-link"
            href={docsLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track('onboarding_explore:dev_docs');
            }}>
            View developer docs
          </TextLink>
          <TextLink
            testId="training-center-link"
            href={learningLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              track('onboarding_explore:training_center');
            }}>
            View training center
          </TextLink>
        </Flex>
        <Flex>
          <Button
            buttonType="primary"
            disabled={!choice}
            onClick={() => onContinue(choice)}
            testId="continue-btn">
            Continue
          </Button>
        </Flex>
      </Flex>
    </Modal.Content>
  );
};
