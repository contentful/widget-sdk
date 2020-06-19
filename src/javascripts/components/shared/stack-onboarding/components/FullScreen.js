import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon';

const FullScreen = ({ children, progressBar, close }) => {
  return (
    <div className="modern-stack-onboarding--container">
      <div className="modern-stack-onboarding--wrapper">
        <div className="modern-stack-onboarding--header">
          <Icon name={'contentful-logo'} />
          {progressBar}
          {close}
        </div>
        {children}
      </div>
    </div>
  );
};

FullScreen.propTypes = {
  children: PropTypes.node,
  progressBar: PropTypes.node,
  close: PropTypes.node,
};

export default FullScreen;
