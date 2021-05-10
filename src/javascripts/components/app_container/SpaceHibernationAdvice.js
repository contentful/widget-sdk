import React from 'react';
import { Heading, Paragraph, Typography, Icon, Flex } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const styles = {
  advice: css({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
  adviceFrame: css({
    maxWidth: '60em',
    backgroundColor: 'white',
    textAlign: 'center',
  }),
};

export default function SpaceHibernationAdvice() {
  return (
    <Flex flexDirection="column" justifyContent="center" className={styles.advice}>
      <Flex flexDirection="column" alignItems="center" className={styles.adviceFrame}>
        <Typography>
          <Flex justifyContent="center">
            <Heading>Hold on! We’re bringing your space back </Heading>
            <Flex marginLeft="spacingS">
              <Icon icon="CloudUpload" size="large" color="muted" />
            </Flex>
          </Flex>

          <Paragraph>
            You haven’t been here for a while, so your space slipped into hibernation.
          </Paragraph>
          <Paragraph>
            Don’t worry, all your content is safe and shall be available for use in a few moments.
          </Paragraph>
        </Typography>
      </Flex>
    </Flex>
  );
}
