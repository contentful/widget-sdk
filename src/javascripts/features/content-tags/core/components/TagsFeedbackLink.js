import FeedbackButton from 'app/common/FeedbackButton';
import React from 'react';
import PropTypes from 'prop-types';

const TagsFeedbackLink = ({ label }) => {
  return <FeedbackButton about="Tags" target="devWorkflows" label={label} />;
};
TagsFeedbackLink.propTypes = {
  label: PropTypes.string,
};

export { TagsFeedbackLink };
