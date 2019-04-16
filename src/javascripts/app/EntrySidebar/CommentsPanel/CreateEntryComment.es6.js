import React, { useState } from 'react';
import PropTypes from 'prop-types';
import keycodes from 'utils/keycodes.es6';
import { Textarea, Button, ValidationMessage } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { useCommentCreator } from './hooks.es6';

const styles = {
  validationMessage: css({
    marginTop: tokens.spacingS
  }),
  replyActions: css({
    marginTop: tokens.spacingS
  })
};

export default function CreateEntryComment({ spaceId, entryId, parentCommentId, onNewComment }) {
  const [showActions, setShowActions] = useState(false);
  const [isSubmitted, setIsSubmited] = useState(false);
  const [body, setBody] = useState('');
  const [{ data, isLoading, error }, createComment] = useCommentCreator(spaceId, entryId);
  const placeholder = parentCommentId ? 'Reply to this comment...' : 'Comment on this entry...';
  const sendButtonLabel = parentCommentId ? 'Reply' : 'Send';

  const handleSubmit = () => {
    if (!body || isLoading) return;
    setIsSubmited(true);
    createComment(body);
  };

  const handleKeyPress = evt => {
    if (evt.keyCode === keycodes.ENTER && evt.metaKey) {
      handleSubmit();
    }
  };

  if (isSubmitted && data) {
    setBody('');
    setIsSubmited(false);
    onNewComment(data);
  }

  return (
    <>
      <Textarea
        value={body}
        onChange={evt => setBody(evt.target.value)}
        onFocus={() => setShowActions(true)}
        onKeyDown={handleKeyPress}
        disabled={isLoading}
        placeholder={placeholder}
      />
      {error && (
        <ValidationMessage className={styles.validationMessage}>{error.message}</ValidationMessage>
      )}
      {showActions && (
        <div className={styles.replyActions}>
          <Button
            size="small"
            onClick={() => handleSubmit()}
            buttonType="primary"
            className={css({ marginRight: tokens.spacingS })}>
            {sendButtonLabel}
          </Button>
          <Button size="small" buttonType="muted" onClick={() => setShowActions(false)}>
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}

CreateEntryComment.propTypes = {
  spaceId: PropTypes.string.isRequired,
  entryId: PropTypes.string.isRequired,
  onNewComment: PropTypes.func.isRequired,
  parentCommentId: PropTypes.string
};
