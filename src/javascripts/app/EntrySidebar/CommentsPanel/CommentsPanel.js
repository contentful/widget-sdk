import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import tokens from '@contentful/forma-36-tokens';
import { Typography, Paragraph, Heading } from '@contentful/forma-36-react-components';

import { useCommentsFetcher } from './hooks';
import CreateComment from './CreateEntryComment';
import CommentThread from './CommentThread';
import CommentsPanelEmptyState from './CommentsPanelEmptyState';
import { CommentSkeletonGroup } from './CommentSkeleton';
import { fromFlatToThreads, isReply, isReplyToComment } from './utils';
import { useSpaceEnvEndpoint } from 'core/hooks/useSpaceEnvEndpoint';

export const styles = {
  root: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    color: tokens.colorTextMid,
    background: tokens.colorElementLightest,
    transition: 'transform .3s cubic-bezier(.38,.54,.5,.99)',
    zIndex: 1,
  }),
  commentList: css({
    overflow: 'auto',
    flexGrow: 1,
    margin: `-${tokens.spacingM}`,
    padding: tokens.spacingM,
  }),
  commentListLoading: css({
    overflow: 'hidden',
  }),
  commentForm: css({
    borderTop: `1px solid ${tokens.colorElementLight}`,
    padding: `${tokens.spacingS} 0`,
    marginTop: tokens.spacingM,
  }),
  errorState: css({
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }),
};

function CommentsPanelContent({ entryId, onCommentsCountUpdate }) {
  const endpoint = useSpaceEnvEndpoint();

  const { isLoading, data, error } = useCommentsFetcher(endpoint, entryId);
  const [comments, setComments] = useState();
  const [shouldScroll, setShouldScroll] = useState(false);
  const listRef = useRef(null);

  const setUpdatedComments = useCallback(
    (comments) => {
      setComments(comments);
      onCommentsCountUpdate(comments.length);
    },
    [onCommentsCountUpdate]
  );

  const handleNewComment = (comment) => {
    const updatedComments = [...comments, comment];
    setUpdatedComments(updatedComments);
    !isReply(comment) && setShouldScroll(true);
  };

  // Remove a single comment or a comment and its replies
  const handleCommentRemoved = (comment) => {
    const isReply = isReplyToComment(comment);
    const newList = comments.filter((item) => {
      return !(item == comment || isReply(item));
    });
    setUpdatedComments(newList);
  };

  // check for the first load of comments.
  // display comments and scroll to the bottom
  // or display empty state
  useEffect(() => {
    if (data) {
      setUpdatedComments(data);
      setShouldScroll(true);
    }
  }, [data, setUpdatedComments]);

  useEffect(() => {
    // scroll to the bottom to show latest comments
    // after the first load or new comments.
    // the effect garantees that the scrolling happens after
    // the comments are rendered
    shouldScroll && scrollToBottom(listRef.current);
    setShouldScroll(false);
  }, [shouldScroll]);

  const isEmpty = !isLoading && !error && comments && comments.length === 0;
  const threads = useMemo(() => fromFlatToThreads(comments), [comments]);

  return (
    <React.Fragment>
      <div
        className={`${styles.commentList} ${isLoading ? styles.commentListLoading : ''}`}
        data-test-id="comments.list"
        ref={listRef}>
        {isLoading && <CommentSkeletonGroup />}
        {isEmpty && <CommentsPanelEmptyState />}
        {threads.length > 0 &&
          threads.map((thread) => (
            <CommentThread
              endpoint={endpoint}
              key={thread[0].sys.id}
              thread={thread}
              onNewReply={handleNewComment}
              onRemoved={handleCommentRemoved}
            />
          ))}
        {error && (
          <div className={styles.errorState} data-test-id="comments.error">
            <Typography>
              <Heading>Something went wrong</Heading>
              <Paragraph>{`We couldn't fetch the comments because of a problem.`}</Paragraph>
            </Typography>
          </div>
        )}
      </div>
      <div className={styles.commentForm} data-test-id="comments.form">
        <CreateComment endpoint={endpoint} entryId={entryId} onNewComment={handleNewComment} />
      </div>
    </React.Fragment>
  );
}

CommentsPanelContent.propTypes = {
  entryId: PropTypes.string.isRequired,
  onCommentsCountUpdate: PropTypes.func.isRequired,
};

export default function CommentsPanel({ isVisible, ...props }) {
  return (
    <div className={`${styles.root}`} data-test-id="comments">
      {isVisible && <CommentsPanelContent {...props} />}
    </div>
  );
}

CommentsPanel.propTypes = {
  ...CommentsPanelContent.propTypes,
  isVisible: PropTypes.bool,
};

function scrollToBottom(element) {
  try {
    // Chrome and Firefox
    element.scroll({
      top: element.scrollHeight,
      left: 0,
      behavior: 'smooth',
    });
  } catch {
    // Safari, IE and Edge
    element.scrollTop = element.scrollHeight;
  }
}
