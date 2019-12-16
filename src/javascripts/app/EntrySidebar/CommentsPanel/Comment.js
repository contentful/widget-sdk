import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css, cx } from 'emotion';
import {
  Heading,
  Tooltip,
  Notification,
  ModalConfirm,
  Paragraph,
  IconButton
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { remove as removeComment } from 'data/CMA/CommentsRepo';
import { canRemoveComment } from './utils';
import * as types from './CommentPropTypes';

export const styles = {
  comment: css({
    display: 'flex',
    flexDirection: 'column',
    marginBottom: tokens.spacingM,
    '&:last-child': {
      marginBottom: 0
    }
  }),
  header: css({
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingM
  }),
  avatar: css({
    width: 36,
    height: 36,
    background: tokens.colorElementLight,
    borderRadius: '100%',
    marginRight: tokens.spacingS
  }),
  avatarSmall: css({
    width: 18,
    height: 18
  }),
  meta: css({
    display: 'flex',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexDirection: 'column'
  }),
  userName: css({
    fontSize: tokens.fontSizeM
  }),
  timestamp: css({
    color: tokens.colorTextLight,
    fontSize: tokens.fontSizeS
  }),
  commentBody: css({
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap'
  }),
  commentBodyIndented: css({
    marginLeft: `calc(${tokens.spacingS} + 18px)` // For aligning comment body with avatar
  })
};

// TODO: Make this a dumb component like <Task /> neither triggering any CMA requests
//  directly, nor receiving an entire CMA `Comment` object.

export default function Comment({ endpoint, comment, onRemoved, className, hasReplies, isReply }) {
  const {
    sys: { createdBy, createdAt }
  } = comment;
  const creationDate = moment(createdAt, moment.ISO_8601);
  const handleRemove = async () => {
    const entry = comment.sys.reference || comment.sys.parentEntity;
    try {
      await removeComment(endpoint, entry.sys.id, comment);
      onRemoved(comment);
    } catch (err) {
      Notification.error(err.message);
    }
  };

  return (
    <div className={cx([styles.comment, className])} data-test-id="comment">
      <header className={styles.header}>
        <img
          className={cx(styles.avatar, isReply && styles.avatarSmall)}
          src={createdBy.avatarUrl}
          data-test-id="comment.avatar"
        />
        <div className={styles.meta}>
          <Heading element="h4" className={styles.userName} data-test-id="comment.user">
            {renderUserName(createdBy)}
          </Heading>
          <time
            dateTime={creationDate.toISOString()}
            title={creationDate.format('LLLL')}
            className={styles.timestamp}
            data-test-id="comment.timestamp">
            {creationDate.fromNow()}
          </time>
        </div>
        <CommentActions comment={comment} onRemove={handleRemove} hasReplies={hasReplies} />
      </header>
      <div
        className={cx(styles.commentBody, isReply && styles.commentBodyIndented)}
        data-test-id="comment.body">
        {comment.body}
      </div>
    </div>
  );
}

Comment.propTypes = {
  endpoint: PropTypes.func.isRequired,
  comment: types.Comment.isRequired,
  onRemoved: PropTypes.func.isRequired,
  className: PropTypes.string,
  // Only used to check if the comment can be removed.
  // Get rid of this once thread deletion is supported by the API
  hasReplies: PropTypes.bool,
  isReply: PropTypes.bool
};

function renderUserName(user) {
  return user.firstName ? (
    <React.Fragment>{`${user.firstName} ${user.lastName}`}</React.Fragment>
  ) : (
    <Tooltip content="The author of this comment is no longer a member of this organization">
      {'(Deactivated user)'}
    </Tooltip>
  );
}

function CommentActions({ comment, onRemove, hasReplies }) {
  const [showRemovalDialog, setShowRemovalDialog] = useState(false);

  if (hasReplies || !canRemoveComment(comment)) return null;

  return (
    <React.Fragment>
      <IconButton
        iconProps={{
          icon: 'Delete'
        }}
        buttonType="muted"
        testId="comment.menu.remove"
        label="Delete comment"
        onClick={() => setShowRemovalDialog(true)}
      />
      <RemovalConfirmationDialog
        isShown={showRemovalDialog}
        onConfirm={() => {
          setShowRemovalDialog(false);
          onRemove();
        }}
        onCancel={() => setShowRemovalDialog(false)}
        data-test-id="comment.removal-confirmation"
      />
    </React.Fragment>
  );
}
CommentActions.propTypes = {
  comment: types.Comment.isRequired,
  onRemove: PropTypes.func.isRequired,
  // Only used to check if the comment can be removed.
  // Get rid of this once thread deletion is supported by the API
  hasReplies: PropTypes.bool
};

function RemovalConfirmationDialog({ isShown, onConfirm, onCancel }) {
  return (
    <ModalConfirm
      isShown={isShown}
      title="Remove comment"
      intent="negative"
      onCancel={onCancel}
      onConfirm={onConfirm}>
      <Paragraph>Are you sure you want to remove this comment?</Paragraph>
    </ModalConfirm>
  );
}
RemovalConfirmationDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
