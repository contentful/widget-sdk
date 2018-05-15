import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

const moduleName = 'full-screen-component';

const FullScreen = createReactClass({
  propTypes: {
    children: PropTypes.node,
    close: PropTypes.node
  },
  render () {
    const { children, close } = this.props;
    return (
      <div className={'modern-stack-onboarding--container'}>
        <div className={'modern-stack-onboarding--wrapper'}>
          <div className={'modern-stack-onboarding--header'}>
            {'CONTENTFUL LOGO>>>>'}
            {close}
          </div>
          {children}
        </div>
      </div>
    );
  }
});

angular.module('contentful')
.factory(moduleName, [function () {
  return FullScreen;
}]);

export const name = moduleName;
