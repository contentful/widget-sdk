import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'stack-onboarding-skip';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const { getStore } = require('TheStore');
  const { getValue } = require('utils/kefir');
  const { user$ } = require('services/TokenStore');
  const $state = require('$state');
  const $stateParams = require('$stateParams');
  const { track } = require(CreateModernOnboardingModule);

  const store = getStore();

  const StackOnboardingSkip = createReactClass({
    propTypes: {
      link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy'])
    },
    onClick () {
      const { link } = this.props;
      const user = getValue(user$);
      const key = `ctfl:${user.sys.id}:onboading_step`;

      const params = {
        spaceId: $stateParams.spaceId
      };

      const path = {
        path: `spaces.detail.onboarding.${link}`,
        params
      };

      track(`skip_from_${link}`);

      store.set(key, path);
      $state.go('spaces.detail.home', params);
    },
    render () {
      return (
        <div onClick={this.onClick} className={'modern-stack-onboarding--skip'}>
          {'Skip >'}
        </div>
      );
    }
  });

  return StackOnboardingSkip;
}]);
