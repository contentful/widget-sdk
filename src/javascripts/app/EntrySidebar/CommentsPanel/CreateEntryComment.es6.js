import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, Button } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import { create as createComment } from 'data/CMA/CommentsRepo.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const styles = {
  replyActions: {
    marginTop: tokens.spacingS
  }
};

export default function CreateEntryComment({ parentCommentId }) {
  const [showActions, setShowActions] = useState(false);
  const [body, setbody] = useState('');
  const placeholder = parentCommentId ? 'Reply to this comment...' : 'Comment on this entry...';
  const sendButtonLabel = parentCommentId ? 'Reply' : 'Send';

  // const handleSubmit = async () => {
  //   const endpoint = createSpaceEndpoint(spaceContext.getId());
  //   const comment = await createComment(endpoint, body, { entryId: '2PFUJiegW1F5ycz2HQEuFO' });
  // };

  return (
    <React.Fragment>
      <TextInput
        value={body}
        onChange={evt => setbody(evt.target.value)}
        placeholder={placeholder}
        onFocus={() => setShowActions(true)}
      />
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
