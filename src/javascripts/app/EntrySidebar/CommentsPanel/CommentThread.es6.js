import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Card } from '@contentful/forma-36-react-components';
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
  thread: css({}),
  showCommentsButton: css({
    margin: `${tokens.spacingM} 0`
  }),
  reply: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    paddingTop: tokens.spacingS
  }),
  replyActions: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    paddingTop: tokens.spacingS,
    marginTop: tokens.spacingS
  })
};

export default function CommentThread({ thread, onRemoved, onNewReply }) {
  const [comment, ...replies] = thread;
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
        <Comment comment={comment} onRemoved={onRemoved} hasReplies={!!replies.length} />

        {replies.length ? (
          <div className={styles.thread}>
            {replies.map(reply => (
              <Comment
                className={styles.reply}
                key={reply.sys.id}
                comment={reply}
                onRemoved={onRemoved}
              />
            ))}
          </div>
        ) : null}

        {replyingMode && (
          <footer className={styles.replyActions}>
            <CreateEntryComment
              spaceId={space.sys.id}
              entryId={entry.sys.id}
              parentCommentId={comment.sys.id}
              onNewComment={onNewReply}
              onActive={() => setHasPendingReply(true)}
              onInactive={() => setHasPendingReply(false)}
            />
          </footer>
        )}
      </Card>
    </div>
  );
}

CommentThread.propTypes = {
  thread: types.CommentThread.isRequired,
  onRemoved: PropTypes.func.isRequired,
  onNewReply: PropTypes.func.isRequired
};
