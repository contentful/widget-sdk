import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {name as CreateModernOnboardingModule} from '../../auto_create_new_space/CreateModernOnboarding';

export const name = 'with-link-onboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const $state = require('$state');
  const spaceContext = require('spaceContext');
  const { track } = require(CreateModernOnboardingModule);
  const store = require('TheStore').getStore();

  const {getStoragePrefix} = require(CreateModernOnboardingModule);

  const WithLink = createReactClass({
    propTypes: {
      link: PropTypes.oneOf(['getStarted', 'copy', 'explore', 'deploy', 'spaceHome']),
      trackingElementId: PropTypes.string.isRequired,
      children: PropTypes.func.isRequired
    },
    render () {
      const { children, trackingElementId } = this.props;
      const getStateParams = () => {
        const { link } = this.props;
        const spaceId = spaceContext.space && spaceContext.space.getId();
        const params = { spaceId };
        let path;

        if (link === 'spaceHome') {
          path = 'spaces.detail.home';
        } else {
          path = `spaces.detail.onboarding.${link}`;
        }

        return {
          path,
          params
        };
      };

      const move = async (_event, newTrackingElementId) => {
        const { path, params } = getStateParams();
        const elementId = newTrackingElementId || trackingElementId;

        if (elementId) {
          track(elementId);
        }

        await $state.go(path, params);
        // set current step after we have successfully transitioned to the new step
        store.set(`${getStoragePrefix()}:currentStep`, {path, params});
      };
      return children(move);
    }
  });

  return WithLink;
}]);
