import { checkSpace } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import GetStartedScreen from 'components/shared/stack-onboarding/screens/GetStartedScreen';
import CopyScreen from 'components/shared/stack-onboarding/screens/CopyScreen';
import ExploreScreen from 'components/shared/stack-onboarding/screens/ExploreScreen';
import DeployScreen from 'components/shared/stack-onboarding/screens/DeployScreen';
import { getSpaceContext } from 'classes/spaceContext';

const getStarted = {
  name: 'getStarted',
  url: '/get-started',
  component: GetStartedScreen,
};

const copyRepo = {
  name: 'copy',
  url: '/copy',
  component: CopyScreen,
};

const explore = {
  name: 'explore',
  url: '/explore',
  component: ExploreScreen,
};

const deploy = {
  name: 'deploy',
  url: '/deploy',
  component: DeployScreen,
};

export default {
  name: 'onboarding',
  url: '/onboarding',
  abstract: true,
  onEnter: [
    '$state',
    function ($state) {
      const spaceContext = getSpaceContext();
      const spaceId = spaceContext.space && spaceContext.space.getId();

      // The onboarding steps are accessible only when
      // the user is in the context of the onboarding space
      if (!checkSpace(spaceId)) {
        $state.go('spaces.detail.home', { spaceId });
      }
    },
  ],
  children: [getStarted, copyRepo, explore, deploy],
};
