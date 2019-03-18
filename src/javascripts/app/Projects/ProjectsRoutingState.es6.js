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
    title: 'Project details',
    sref: 'projects.home',
    rootSref: 'projects'
    // icon: 'nav-organization-information',
  }
]);

const homeState = makeState({
  name: 'home',
  url: '/:projectId',
  loadingText: 'Loading…',
  template: `<react-component name='app/Projects/ProjectHome/ProjectHomeRouter.es6' props='componentProps'></react-component>`,
  controller: [
    '$scope',
    '$stateParams',
    async ($scope, $stateParams) => {
      $scope.componentProps = {
        onReady: () => {
          $scope.context.ready = true;
        },
        onForbidden: () => {
          $scope.context.forbidden = true;
        },
        projectId: $stateParams.projectId,
        orgId: $stateParams.orgId
      };

      // Determine if the projects is enabled for this
      // user. If not, redirect them as if they went to
      // a bad URL
      //
      // The reason this happens here and not a resolver is
      // so that the `Loading...` text can be displayed to
      // the user rather than a blank screen.
      const isEnabled = await projectsEnabled();

      if (!isEnabled) {
        go({
          path: ['home']
        });

        return;
      }

      $scope.$applyAsync();
    }
  ]
});

export default makeState({
  name: 'projects',
  url: '/account/organizations/:orgId/projects',
  abstract: true,
  navTemplate: template,
  children: [homeState]
});
