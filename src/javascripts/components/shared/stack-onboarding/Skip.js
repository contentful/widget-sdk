import React from 'react';
import createReactClass from 'create-react-class';

const moduleName = 'stack-onboarding-skip';

angular.module('contentful')
.factory(moduleName, ['require', function () {
  const StackOnboardingSkip = createReactClass({
    onClick () {
      // 1. put current path in local storage for the current user
      // 2. redirect user to the space home
      // so space home works as expected
    },
    render () {
      return (
        <div onClick={this.onClick}>
          {'Skip >'}
        </div>
      );
    }
  });

  return StackOnboardingSkip;
}]);

export const name = moduleName;
