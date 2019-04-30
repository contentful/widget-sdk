import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { css, cx } from 'emotion';
import {
  CardActions,
  DropdownList,
  DropdownListItem,
  Heading,
  Tooltip,
  Notification,
  ModalConfirm
} from '@contentful/forma-36-react-components';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import tokens from '@contentful/forma-36-tokens';
import { remove as removeComment } from 'data/CMA/CommentsRepo.es6';
import { canRemoveComment } from './utils.es6';
import * as types from './CommentPropTypes.es6';

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
  })
};

export default function Comment({ comment, onRemoved, className, hasReplies }) {
  const {
    sys: { createdBy, createdAt }
  } = comment;
  const creationDate = moment(createdAt, moment.ISO_8601);

  const handleRemove = async () => {
    const {
      sys: { space, reference: entry, id: commentId }
    } = comment;
    const endpoint = createSpaceEndpoint(space.sys.id);
    try {
      await removeComment(endpoint, entry.sys.id, commentId);
      onRemoved(comment);
    } catch (err) {
      Notification.error(err.message);
    }
  };

  return (
    <div className={cx([styles.comment, className])}>
      <header className={styles.header}>
        <img className={styles.avatar} src={createdBy.avatarUrl} />
        <div className={styles.meta}>
          <Heading element="h4" className={styles.userName}>
            {renderUserName(createdBy)}
          </Heading>
          <time
            dateTime={creationDate.toISOString()}
            title={creationDate.format('LLLL')}
            className={styles.timestamp}>
            {creationDate.fromNow()}
          </time>
        </div>
        <CommentActions comment={comment} onRemove={handleRemove} hasReplies={hasReplies} />
      </header>
      <div className={styles.commentBody}>{comment.body}</div>
    </div>
  );
}

Comment.propTypes = {
  comment: types.Comment.isRequired,
  onRemoved: PropTypes.func.isRequired,
  className: PropTypes.string,
  // Only used to check if the comment can be removed.
  // Get rid of this once thread deletion is supported by the API
  hasReplies: PropTypes.bool
};

function renderUserName(user) {
  return user.firstName ? (
    <>{`${user.firstName} ${user.lastName}`}</>
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
    <>
      <CardActions onClick={e => e.stopPropagation()}>
        <DropdownList>
          <DropdownListItem onClick={() => setShowRemovalDialog(true)}>Remove</DropdownListItem>
        </DropdownList>
      </CardActions>
      <RemovalConfirmationDialog
        isShown={showRemovalDialog}
        onConfirm={() => {
          setShowRemovalDialog(false);
          onRemove();
        }}
        onCancel={() => setShowRemovalDialog(false)}
      />
    </>
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
      <p>Are you sure you want to remove this comment?</p>
    </ModalConfirm>
  );
}
RemovalConfirmationDialog.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
