import React from 'react';
import { Typography, Paragraph, Heading } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

import CommentsPanelEmptyIcon from './CommentsPanelEmptyIcon.es6';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  root: css({
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    flexDirection: 'column'
  }),
  text: css({
    marginTop: tokens.spacingS
  })
};

export default function CommentsPanelEmptyState() {
  return (
    <div className={styles.root}>
      <CommentsPanelEmptyIcon />
      <Typography className={styles.text}>
        <Heading>Start a conversation</Heading>
        <Paragraph>No one has commented on this entry yet.</Paragraph>
      </Typography>
    </div>
  );
}
