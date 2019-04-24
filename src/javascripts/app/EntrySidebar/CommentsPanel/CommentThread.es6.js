import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Card, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as types from './CommentPropTypes.es6';
import Comment from './Comment.es6';
import CreateEntryComment from './CreateEntryComment.es6';
import useClickOutside from 'app/common/hooks/useClickOutside.es6';

const styles = {
  root: css({
    padding: tokens.spacingS,
    marginBottom: tokens.spacingS,
    '&:hover': {
      borderColor: tokens.colorBlueBase,
      cursor: 'pointer'
    }
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

export default function CommentThread({ comment, replies = [], onRemoved }) {
  const {
    sys: { reference: entry, space }
  } = comment;
  const ref = useRef();
  const [replyingMode, setReplyingMode] = useState(false);
  const [hasPendingReply, setHasPendingReply] = useState(false);

  useClickOutside(ref, replyingMode, () => {
    // dismiss reply mode if reply field is empty
    if (!hasPendingReply) {
      setReplyingMode(false);
    }
  });

  return (
    <div ref={ref}>
      <Card className={styles.root} onClick={() => setReplyingMode(true)}>
        <Comment comment={comment} onRemoved={onRemoved} />

        {replies.length ? (
          <React.Fragment>
            <TextLink icon="ChevronRightTrimmed" className={styles.showCommentsButton}>
              Show all 10 replies
            </TextLink>
          </React.Fragment>
        ) : null}

        {replyingMode && (
          <CreateEntryComment
            spaceId={space.sys.id}
            entryId={entry.sys.id}
            parentCommentId={comment.sys.id}
            onActive={() => setHasPendingReply(true)}
            onInactive={() => setHasPendingReply(false)}
          />
        )}
      </Card>
    </div>
  );
}

CommentThread.propTypes = {
  comment: types.Comment.isRequired,
  onRemoved: PropTypes.func.isRequired,
  replies: PropTypes.arrayOf(types.Comment)
};
