import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Card, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as types from './CommentPropTypes.es6';
import Comment from './Comment.es6';
import CreateComment from './CreateEntryComment.es6';

const styles = {
  root: {
    padding: tokens.spacingS,
    marginBottom: tokens.spacingS
  },
  footer: {
    marginTop: tokens.spacingM
  },
  thread: {
    paddingLeft: tokens.spacingS,
    boxShadow: `inset 2px 0 0 ${tokens.colorBlueDark}`,
    marginLeft: `-${tokens.spacingS}`
  },
  showCommentsButton: {
    margin: `${tokens.spacingM} 0`
  },
  replyActions: {
    marginTop: tokens.spacingS
  }
};

export default function CommentThread(props) {
  return (
    <Card className={css(styles.root)}>
      <Comment comment={props.comment} />

      {props.replies && props.replies.length && (
        <React.Fragment>
          <TextLink icon="ChevronRightTrimmed" className={css(styles.showCommentsButton)}>
            Show all 10 replies
          </TextLink>
        </React.Fragment>
      )}
      <footer className={css(styles.footer)}>
        <CreateComment parentCommentId="123" />
      </footer>
    </Card>
  );
}

CommentThread.propTypes = {
  comment: types.Comment.isRequired,
  replies: PropTypes.arrayOf(types.Comment)
};
