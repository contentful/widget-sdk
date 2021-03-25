// https://weblogs.asp.net/dwahlin/dynamically-loading-controllers-and-views-with-angularjs-and-requirejs

import angular from 'angular';

import classesSpaceContextEs6 from 'classes/spaceContext';
import componentsClientClientControllerEs6 from 'components/client/ClientController';
import statesConfigEs6 from 'states/config';
import componentsAppContainerCfAppContainerDirectiveEs6 from 'components/app_container/cfAppContainerDirective';

export const angularInitRun = [
  '$injector',
  async ($injector) => {
    angular.module('contentful/init').getModule = $injector.get;
    angular.module('contentful/init').loaded = false;

    // ClientController and cf-app-container must be available immediately for the app to
    // load correctly. Its dependencies and the directives in the app container template
    // are also required. The other modules below can be imported lazily.
    classesSpaceContextEs6();
    componentsClientClientControllerEs6();
    statesConfigEs6();
    componentsAppContainerCfAppContainerDirectiveEs6();

    const modules = await Promise.all([
      import(/* webpackMode: "eager" */ 'app/ContentModel/Editor/contentTypeEditorController'),
      import(/* webpackMode: "eager" */ 'services/exceptionHandler'),
      import(/* webpackMode: "eager" */ 'ui/Framework/ReactDirective'),
    ]);
    modules.forEach((module) => module.default());

    angular.module('contentful/init').loaded = true;
  },
];

export default angular
  .module('contentful/init', [])
  .config([
    '$controllerProvider',
    '$compileProvider',
    '$filterProvider',
    '$provide',
    ($controllerProvider, $compileProvider, $filterProvider, $provide) => {
      angular.module('contentful/init').register = {
        controller: $controllerProvider.register,
        directive: $compileProvider.directive,
        filter: $filterProvider.register,
        factory: $provide.factory,
        service: $provide.service,
        constant: $provide.constant,
        provider: $provide.provider,
        value: $provide.value,
      };
    },
  ])
  .run(angularInitRun).name;
