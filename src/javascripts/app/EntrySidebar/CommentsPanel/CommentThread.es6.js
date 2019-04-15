import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Card, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as types from './CommentPropTypes.es6';
import Comment from './Comment.es6';
// import CreateComment from './CreateEntryComment.es6';

const styles = {
  root: css({
    padding: tokens.spacingS,
    marginBottom: tokens.spacingS
  }),
  footer: css({
    marginTop: tokens.spacingM
  }),
  thread: css({
    paddingLeft: tokens.spacingS,
    boxShadow: `inset 2px 0 0 ${tokens.colorBlueDark}`,
    marginLeft: `-${tokens.spacingS}`
  }),
  showCommentsButton: css({
    margin: `${tokens.spacingM} 0`
  }),
  replyActions: css({
    marginTop: tokens.spacingS
  })
};

export default function CommentThread({ comment, replies = [] }) {
  return (
    <Card className={styles.root}>
      <Comment comment={comment} />

      {replies.length ? (
        <React.Fragment>
          <TextLink icon="ChevronRightTrimmed" className={styles.showCommentsButton}>
            Show all 10 replies
          </TextLink>
        </React.Fragment>
      ) : null}
      <footer className={styles.footer}>{/* <CreateComment parentCommentId="123" /> */}</footer>
    </Card>
  );
}

CommentThread.propTypes = {
  comment: types.Comment.isRequired,
  replies: PropTypes.arrayOf(types.Comment)
};
