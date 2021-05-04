import React from 'react';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import MediaEmptyStateIllustration from 'svg/media-empty-state.svg';
import { css } from 'emotion';

const styles = {
  container: css({
    textAlign: 'center',
    padding: tokens.spacingM,
  }),
  heading: css({
    marginBottom: tokens.spacingS,
  }),
  illustration: css({
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacingM,
    width: '400px',
  }),
};

type ScheduledActionsEmptyStateMessageProps = {
  title: string;
  text: string;
};

const ScheduledActionsEmptyStateMessage = ({
  title,
  text,
}: ScheduledActionsEmptyStateMessageProps) => {
  return (
    <div className={styles.container}>
      <MediaEmptyStateIllustration className={styles.illustration} />
      <Heading className={styles.heading} testId="jobs-state-message-heading">
        {title}
      </Heading>
      <Paragraph>{text}</Paragraph>
    </div>
  );
};

export { ScheduledActionsEmptyStateMessage };
