import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import { Typography, Paragraph, Heading } from '@contentful/forma-36-react-components';

import { useCommentsFetcher } from './hooks.es6';
import CreateComment from './CreateEntryComment.es6';
import CommentThread from './CommentThread.es6';
import CommentsPanelEmptyState from './CommentsPanelEmptyState.es6';
import { CommentSkeletonGroup } from './CommentSkeleton.es6';
import { fromFlatToThreads, isReply, isReplyToComment } from './utils.es6';

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
  errorState: css({
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  })
};

export default function CommentsPanel({ spaceId, entryId, isVisible }) {
  const { isLoading, data, error } = useCommentsFetcher(spaceId, entryId);
  const [comments, setComments] = useState();
  const [shouldScroll, setShouldScroll] = useState(false);
  const listRef = useRef(null);

  const handleNewComment = comment => {
    setComments([...comments, comment]);
    !isReply(comment) && setShouldScroll(true);
  };

  // Remove a single comment or a comment and its replies
  const handleCommentRemoved = comment => {
    const isReply = isReplyToComment(comment);
    const newList = comments.filter(item => {
      return !(item == comment || isReply(item));
    });
    setComments(newList);
  };

  // check for the first load of comments.
  // display comments and scroll to the bottom
  // or display empty state
  useEffect(() => {
    if (data) {
      setComments(data);
      setShouldScroll(true);
    }
  }, [data]);

  useEffect(() => {
    // scroll to the bottom to show latest comments
    // after the first load or new comments.
    // the effect garantees that the scrolling happens after
    // the comments are rendered
    shouldScroll && scrollToBottom(listRef.current);
    setShouldScroll(false);
  }, [shouldScroll]);

  const isEmpty = !isLoading && !error && comments && comments.length === 0;
  const threads = fromFlatToThreads(comments);

  return (
    <div className={`${styles.root} ${isVisible ? styles.visible : styles.hidden}`}>
      <div
        className={`${styles.commentList} ${isLoading ? styles.commentListLoading : ''}`}
        ref={listRef}>
        {isLoading && <CommentSkeletonGroup />}
        {isEmpty && <CommentsPanelEmptyState />}
        {threads.length > 0 &&
          threads.map(thread => (
            <CommentThread
              key={thread[0].sys.id}
              thread={thread}
              onNewReply={handleNewComment}
              onRemoved={handleCommentRemoved}
            />
          ))}
        {error && (
          <div className={styles.errorState}>
            <Typography>
              <Heading>Something went wrong</Heading>
              <Paragraph>{`We couldn't fetch the comments because of a problem.`}</Paragraph>
            </Typography>
          </div>
        )}
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
    // Chrome and Firefox
    element.scroll({
      top: element.scrollHeight,
      left: 0,
      behavior: 'smooth'
    });
  } catch {
    // Safari, IE and Edge
    element.scrollTop = element.scrollHeight;
  }
}
