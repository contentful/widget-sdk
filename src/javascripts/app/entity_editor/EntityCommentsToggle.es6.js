import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';

const EntityCommentsToggle = ({ onClick, isActive, commentsCount }) => {
  let buttonText = 'Comments';
  if (commentsCount) {
    buttonText = commentsCount === 1 ? '1 comment' : `${commentsCount} comments`;
  }

  return (
    <Button
      buttonType="muted"
      className="btn--has-alpha-button-label"
      isActive={isActive}
      onClick={onClick}>
      {buttonText}
      <div className="btn__alpha-button-label">Alpha</div>
    </Button>
  );
};

EntityCommentsToggle.propTypes = {
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
  commentsCount: PropTypes.number
};

export default EntityCommentsToggle;
