import React from 'react';
import PropTypes from 'prop-types';

export const name = 'full-screen-component';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const ContentfulLogo = require('svg/ContentfulLogo').default;

  const FullScreen = ({ children, close }) => {
    return (
      <div className='modern-stack-onboarding--container'>
        <div className='modern-stack-onboarding--wrapper'>
          <div className='modern-stack-onboarding--header'>
            <ContentfulLogo />
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

  return FullScreen;
}]);
