import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';

const FullScreen = ({ children, close }) => {
  return (
    <div className="modern-stack-onboarding--container">
      <div className="modern-stack-onboarding--wrapper">
        <div className="modern-stack-onboarding--header">
          <Icon name={'contentful-logo'} />
          {close}
        </div>
        {children}
      </div>
    </div>
  );
};

FullScreen.propTypes = {
  children: PropTypes.node,
  close: PropTypes.node
};

export default FullScreen;
