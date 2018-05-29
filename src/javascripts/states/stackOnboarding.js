import {name as getStartedModule} from '../components/shared/stack-onboarding/screens/GetStartedScreen';
import {name as copyRepoModule} from '../components/shared/stack-onboarding/screens/CopyScreen';
import {name as exploreModule} from '../components/shared/stack-onboarding/screens/ExploreScreen';
import {name as deployModule} from '../components/shared/stack-onboarding/screens/DeployScreen';

export const name = 'states/stackOnboarding';

angular.module('contentful')
.factory(name, [function () {
  const getStarted = {
    name: 'getStarted',
    url: '/get-started',
    template: `<react-component name="${getStartedModule}"></react-component>`
  };

  const copyRepo = {
    name: 'copy',
    url: '/copy',
    template: `<react-component name="${copyRepoModule}"></react-component>`
  };

  const explore = {
    name: 'explore',
    url: '/explore',
    template: `<react-component name="${exploreModule}"></react-component>`
  };

  const deploy = {
    name: 'deploy',
    url: '/deploy',
    template: `<react-component name="${deployModule}"></react-component>`
  };

  return {
    name: 'onboarding',
    url: '/onboarding',
    abstract: true,
    children: [getStarted, copyRepo, explore, deploy]
  };
}]);
