import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';

import { useCommentsFetcher } from './hooks.es6';
import CreateComment from './CreateEntryComment.es6';
import CommentThread from './CommentThread.es6';

const styles = {
  root: css({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: '0',
    overflowY: 'auto',
    overflowX: 'hidden',
    color: tokens.colorTextMid,
    background: tokens.colorElementLightest,
    borderLeft: `1px solid ${tokens.colorElementDarkest}`,
    transition: 'transform .3s cubic-bezier(.38,.54,.5,.99)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1
  }),
  hidden: css({
    transform: 'translateX(100%)'
  }),
  visible: css({
    transform: 'translateX(-1px)'
  }),
  commentList: css({
    overflow: 'auto',
    padding: tokens.spacingS,
    flexGrow: 1
  }),
  commentForm: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    padding: tokens.spacingS
  })
};

export default function CommentsPanel({ spaceId, entryId, isVisible }) {
  const { isLoading, isError, data } = useCommentsFetcher(spaceId, entryId);
  const [newComments, setNewComments] = useState([]);
  const handleNewComment = comment => setNewComments(() => [...newComments, comment]);

  if (isLoading) {
    return 'Loading comments';
  } else if (isError) {
    return 'An error happened';
  } else if (!data) {
    return null;
  }

  const { items } = data;
  const comments = items.concat(newComments);

  return (
    <div className={`${styles.root} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.commentList}>
        {comments.map(comment => (
          <CommentThread key={comment.sys.id} comment={comment} />
        ))}
      </div>
      <div className={styles.commentForm}>
        <CreateComment spaceId={spaceId} entryId={entryId} onNewComment={handleNewComment} />
      </div>
    </div>
  );
}

CommentsPanel.propTypes = {
  spaceId: PropTypes.string.isRequired,
  entryId: PropTypes.string.isRequired,
  environmentId: PropTypes.string,
  isVisible: PropTypes.bool
};
