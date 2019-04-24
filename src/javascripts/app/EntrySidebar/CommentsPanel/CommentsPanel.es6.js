import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import { Typography, Paragraph, Heading } from '@contentful/forma-36-react-components';

import { useCommentsFetcher } from './hooks.es6';
import CreateComment from './CreateEntryComment.es6';
import CommentThread from './CommentThread.es6';
import { CommentSkeletonGroup } from './CommentSkeleton.es6';

export const styles = {
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
  commentListLoading: css({
    overflow: 'hidden'
  }),
  commentForm: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    padding: tokens.spacingS
  }),
  emptyState: css({
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  })
};

export default function CommentsPanel({ spaceId, entryId, isVisible }) {
  const { isLoading, data } = useCommentsFetcher(spaceId, entryId);
  const [comments, setComments] = useState([]);
  const [isEmpty, setIsEmpty] = useState(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const listRef = useRef(null);

  const handleNewComment = comment => {
    setComments([...comments, comment]);
    setShouldScroll(true);
  };

  // A thread can be a single comment or a comment and its replies
  const handleRemovedThread = comment => {
    const newList = comments.filter(item => item !== comment);
    setComments(newList);
    !newList.length && setIsEmpty(true);
  };

  useEffect(() => {
    if (data) {
      setComments(data);
      setShouldScroll(true);
      if (!data.length) {
        setIsEmpty(true);
      } else {
        setIsEmpty(false);
      }
    }
  }, [data]);

  useEffect(() => {
    // scroll to the bottom to show latest comments
    // after the first load or new comments
    // this effect is need because `setState` hook doesnt allow callbacks
    shouldScroll && scrollToBottom(listRef.current);
    setShouldScroll(false);
  }, [shouldScroll]);

  return (
    <div className={`${styles.root} ${isVisible ? styles.visible : styles.hidden}`}>
      <div
        className={`${styles.commentList} ${isLoading ? styles.commentListLoading : ''}`}
        ref={listRef}>
        {isLoading && <CommentSkeletonGroup />}
        {!isLoading && isEmpty && (
          <div className={styles.emptyState}>
            <Typography>
              <Heading>Start a conversation</Heading>
              <Paragraph>No one has commented on this entry yet.</Paragraph>
            </Typography>
          </div>
        )}
        {comments.length > 0 &&
          comments.map(comment => (
            <CommentThread key={comment.sys.id} comment={comment} onRemoved={handleRemovedThread} />
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

function scrollToBottom(element) {
  try {
    element.scroll({
      top: 9999,
      left: 0,
      behavior: 'smooth'
    });
  } catch {
    // Safari, IE and Edge
    element.scrollTop = element.scrollHeight;
  }
}
