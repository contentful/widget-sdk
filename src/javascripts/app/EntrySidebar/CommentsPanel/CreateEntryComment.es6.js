import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, Button } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  replyActions: {
    marginTop: tokens.spacingS
  }
};

export default function CreateEntryComment({ parentCommentId }) {
  const [showActions, setShowActions] = useState(false);
  const placeholder = parentCommentId ? 'Reply to this comment...' : 'Comment on this entry...';
  const sendButtonLabel = parentCommentId ? 'Reply' : 'Send';

  return (
    <React.Fragment>
      <TextInput placeholder={placeholder} onFocus={() => setShowActions(true)} />
      {showActions && (
        <div className={css(styles.replyActions)}>
          <Button
            size="small"
            buttonType="primary"
            className={css({ marginRight: tokens.spacingS })}>
            {sendButtonLabel}
          </Button>
          <Button size="small" buttonType="muted" onClick={() => setShowActions(false)}>
            Cancel
          </Button>
        </div>
      )}
    </React.Fragment>
  );
}

CreateEntryComment.propTypes = {
  parentCommentId: PropTypes.string
};
