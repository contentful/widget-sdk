import React from 'react';
import { css } from 'emotion';
import { Heading, Subheading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflowX: 'hidden',
    textAlign: 'center',
  }),
  errorDescription: css({
    marginBottom: tokens.spacingL,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightNormal,
  }),
  title: css({
    marginBottom: tokens.spacingL,
    fontSize: tokens.fontSize2Xl,
    fontWeight: '500',
  }),
  message: css({
    '&:not(:last-child)': {
      marginBottom: tokens.spacingM,
    },
    fontSize: tokens.fontSizeXl,
    textAlign: 'center',
    lineHeight: tokens.fontSizeXl,
  }),
};

function AccessForbidden() {
  return (
    <div className={styles.container}>
      <Subheading className={styles.errorDescription}>Access forbiddens (403)</Subheading>
      <Heading className={styles.title}>You don’t have access to this page.</Heading>
      <Paragraph className={styles.message}>
        Contact the administrator of this space to get access.
      </Paragraph>
      <Paragraph className={styles.message}>
        You can always access your account settings or try to switch to some other space.
      </Paragraph>
    </div>
  );
}

export default AccessForbidden;
