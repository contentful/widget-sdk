import { checkSpace } from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';

const getStarted = {
  name: 'getStarted',
  url: '/get-started',
  template: `<react-component name="components/shared/stack-onboarding/screens/GetStartedScreen.es6"></react-component>`
};

const copyRepo = {
  name: 'copy',
  url: '/copy',
  template: `<react-component name="components/shared/stack-onboarding/screens/CopyScreen.es6"></react-component>`
};

const explore = {
  name: 'explore',
  url: '/explore',
  template: `<react-component name="components/shared/stack-onboarding/screens/ExploreScreen.es6"></react-component>`
};

const deploy = {
  name: 'deploy',
  url: '/deploy',
  template: `<react-component name="components/shared/stack-onboarding/screens/DeployScreen.es6"></react-component>`
};

export default {
  name: 'onboarding',
  url: '/onboarding',
  abstract: true,
  onEnter: [
    '$state',
    'spaceContext',
    function($state, spaceContext) {
      const spaceId = spaceContext.space && spaceContext.space.getId();

      // The onboarding steps are accessible only when
      // the user is in the context of the onboarding space
      if (!checkSpace(spaceId)) {
        $state.go('spaces.detail.home', { spaceId });
      }
    }
  ],
  children: [getStarted, copyRepo, explore, deploy]
};