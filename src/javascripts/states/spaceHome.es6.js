import base from 'states/Base.es6';
import homeTemplateDef from 'app/home/HomeTemplate.es6';
import { spaceHomeController } from 'states/SpaceHomeController.es6';
import { spaceResolver } from 'states/Resolvers.es6';

export default base({
  name: 'home',
  url: '/home',
  label: 'Space home',
  resolve: {
    space: spaceResolver
  },
  template: homeTemplateDef(),
  loadingText: 'Loading…',
  controller: [
    '$scope',
    'space',
    'access_control/AccessChecker/index.es6',
    'Config.es6',
    spaceHomeController
  ]
});
