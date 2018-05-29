import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';

export const name = 'with-link-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const $state = require('$state');
  const $stateParams = require('$stateParams');

  const WithLink = createReactClass({
    propTypes: {
      link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy', 'spaceHome']),
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
      const { children } = this.props;
      // we need to bind `this` context, so no arrow functions
      const move = function move () {
        const { path, params } = this.getStateParams();
        $state.go(path, params);
      };
      return children(move.bind(this));
    }
  });

  return WithLink;
}]);
