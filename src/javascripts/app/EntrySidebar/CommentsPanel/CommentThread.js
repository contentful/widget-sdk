import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import pluralize from 'pluralize';

import { Card, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as types from './CommentPropTypes';
import Comment from './Comment';
import CreateEntryComment from './CreateEntryComment';

const styles = {
  root: css({
    padding: tokens.spacingS,
    marginBottom: tokens.spacingS
  }),
  footer: css({
    marginTop: tokens.spacingM
  }),
  thread: css({
    marginTop: tokens.spacingM
  }),
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

export default function CommentThread({ endpoint, thread, onRemoved, onNewReply }) {
  const [comment, ...replies] = thread;
  const entry = comment.sys.reference || comment.sys.parentEntity;
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef();

  useEffect(() => {
    isExpanded && !replies.length && textareaRef.current.focus();
  });

  return (
    <div>
      <Card className={styles.root} data-test-id="comments.thread">
        <Comment
          endpoint={endpoint}
          comment={comment}
          onRemoved={onRemoved}
          hasReplies={!!replies.length}
        />

        <TextLink icon="ChatBubble" onClick={() => setIsExpanded(!isExpanded)}>
          {replies.length ? pluralize('reply', replies.length, true) : 'Reply'}
        </TextLink>

        {isExpanded && (
          <div>
            {replies.length ? (
              <div className={styles.thread}>
                {replies.map(reply => (
                  <Comment
                    className={styles.reply}
                    key={reply.sys.id}
                    endpoint={endpoint}
                    comment={reply}
                    onRemoved={onRemoved}
                    isReply
                  />
                ))}
              </div>
            ) : null}

            <footer className={styles.replyActions}>
              <CreateEntryComment
                endpoint={endpoint}
                entryId={entry.sys.id}
                parentCommentId={comment.sys.id}
                onNewComment={onNewReply}
                textareaRef={textareaRef}
              />
            </footer>
          </div>
        )}
      </Card>
    </div>
  );
}

CommentThread.propTypes = {
  endpoint: PropTypes.func.isRequired,
  thread: types.CommentThread.isRequired,
  onRemoved: PropTypes.func.isRequired,
  onNewReply: PropTypes.func.isRequired
};
