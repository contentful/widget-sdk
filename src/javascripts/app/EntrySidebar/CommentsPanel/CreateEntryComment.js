import React, { useState } from 'react';
import PropTypes from 'prop-types';
import keycodes from 'utils/keycodes';
import { Textarea, Button, ValidationMessage } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { useCommentCreator } from './hooks';

const styles = {
  validationMessage: css({
    marginTop: tokens.spacingS
  }),
  replyActions: css({
    marginTop: tokens.spacingS
  }),
  textField: css({
    textarea: {
      resize: 'none'
    }
  })
};

export default function CreateEntryComment({
  endpoint,
  entryId,
  parentCommentId,
  onNewComment,
  textareaRef,
  onBlur
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitted, setIsSubmited] = useState(false);
  const [body, setBody] = useState('');
  const [{ data, isLoading, error }, createComment, resetCreatorState] = useCommentCreator(
    endpoint,
    entryId,
    parentCommentId
  );
  const placeholder = parentCommentId ? 'Reply to this comment...' : 'Comment on this entry...';
  const sendButtonLabel = parentCommentId ? 'Post reply' : 'Post comment';

  const handleSubmit = () => {
    if (!body || isLoading) return;
    setIsSubmited(true);
    createComment(body);
  };

  const handleChange = evt => {
    const {
      target: { value }
    } = evt;
    setBody(value);
    if (value) {
      setIsExpanded(true);
    }
  };

  const handleCancel = () => {
    setBody('');
    // get rid of any error message from the creation call
    resetCreatorState();
    setIsExpanded(false);
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
    setIsExpanded(false);
  }

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (body) return;
    onBlur ? onBlur() : setIsExpanded(false);
  };

  return (
    <>
      <Textarea
        className={styles.textField}
        value={body}
        onChange={handleChange}
        rows={isExpanded ? 4 : 1}
        onKeyDown={handleKeyPress}
        disabled={isLoading}
        testId="comments.form.textarea"
        placeholder={placeholder}
        maxLength={512}
        onFocus={handleFocus}
        onBlur={handleBlur}
        textareaRef={textareaRef}
      />
      {isExpanded && error && (
        <ValidationMessage className={styles.validationMessage}>{error.message}</ValidationMessage>
      )}
      {isExpanded && (
        <div className={styles.replyActions}>
          <Button
            size="small"
            loading={isLoading}
            onClick={() => handleSubmit()}
            buttonType="primary"
            disabled={!body.length}
            testId="comments.form.submit"
            className={css({ marginRight: tokens.spacingS })}>
            {sendButtonLabel}
          </Button>
          <Button
            size="small"
            buttonType="muted"
            onClick={event => handleCancel(event)}
            testId="comments.form.cancel">
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}

CreateEntryComment.propTypes = {
  endpoint: PropTypes.func.isRequired,
  entryId: PropTypes.string.isRequired,
  onNewComment: PropTypes.func.isRequired,
  parentCommentId: PropTypes.string,
  textareaRef: PropTypes.any,
  onBlur: PropTypes.func
};
