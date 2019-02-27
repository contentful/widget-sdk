/*
  Angular UI routing state for Projects
 */

import makeState from 'states/Base.es6';
import navBarTemplate from 'navigation/templates/NavBar.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import { PROJECTS_FLAG } from 'featureFlags.es6';
import { go } from 'states/Navigator.es6';

const projectsEnabled = () => getCurrentVariation(PROJECTS_FLAG);

const template = navBarTemplate([
  {
    title: 'Home',
    sref: 'projects.home',
    rootSref: 'projects'
    // icon: 'nav-organization-information',
  }
]);

const homeState = makeState({
  name: 'home',
  url: '/:projectId',
  loadingText: 'Loading…',
  template: '<h1>My awesome project!</h1>',
  controller: [
    '$scope',
    async $scope => {
      const isEnabled = await projectsEnabled();

      if (!isEnabled) {
        go({
          path: ['home']
        });

        return;
      }

      $scope.context.ready = true;
      $scope.$applyAsync();
    }
  ]
});

export default makeState({
  name: 'projects',
  url: '/projects',
  abstract: true,
  navTemplate: template,
  children: [homeState]
});
