/*
  Angular UI routing state for Projects
 */

import makeState from 'states/Base.es6';
import navBarTemplate from 'navigation/templates/NavBar.es6';

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
  template: '<h1>My awesome project!</h1>',
  controller: [
    '$scope',
    $scope => {
      $scope.context.ready = true;
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
