import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon';

const FullScreen = ({ children, progressBar, close, backgroundColor }) => {
  return (
    <div
      className={classnames('modern-stack-onboarding--container', {
        'modern-stack-onboarding--white': backgroundColor === 'white',
        'modern-stack-onboarding--element-lightest': backgroundColor === 'elementLightest',
      })}>
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
  backgroundColor: PropTypes.oneOf(['elementLightest', 'white']),
};

export default FullScreen;
