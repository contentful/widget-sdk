import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'with-link-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const $state = require('$state');
  const $stateParams = require('$stateParams');
  const { track } = require(CreateModernOnboardingModule);

  const WithLink = createReactClass({
    propTypes: {
      link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy', 'spaceHome']),
      trackingElementId: PropTypes.string.isRequired,
      children: PropTypes.func.isRequired
    },
    getStateParams () {
      const { link } = this.props;
      const params = { spaceId: $stateParams.spaceId };
      if (link === 'spaceHome') {
        return {
          path: 'spaces.detail.home',
          params
        };
      }

      return {
        path: `spaces.detail.onboarding.${link}`,
        params
      };
    },
    render () {
      const { children, trackingElementId } = this.props;
      // we need to bind `this` context, so no arrow functions
      const move = function move () {
        if (trackingElementId) {
          track(trackingElementId);
        }
        const { path, params } = this.getStateParams();
        $state.go(path, params);
      };
      return children(move.bind(this));
    }
  });

  return WithLink;
}]);
