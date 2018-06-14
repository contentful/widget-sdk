import React from 'react';
import PropTypes from 'prop-types';

export const name = 'full-screen-component';

const FullScreen = ({ children, close }) => {
  return (
    <div className='modern-stack-onboarding--container'>
      <div className='modern-stack-onboarding--wrapper'>
        <div className='modern-stack-onboarding--header'>
          CONTENTFUL LOGO HERE
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

angular.module('contentful')
.factory(name, [function () {
  return FullScreen;
}]);
