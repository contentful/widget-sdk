// https://weblogs.asp.net/dwahlin/dynamically-loading-controllers-and-views-with-angularjs-and-requirejs

import angular from 'angular';

import componentsClientClientControllerEs6 from 'components/client/ClientController';
import statesConfigEs6 from 'states/config';
import componentsAppContainerCfAppContainerDirectiveEs6 from 'components/app_container/cfAppContainerDirective';
import registerExceptionHandler from 'services/exceptionHandler';
import registerReactDirective from 'ui/Framework/ReactDirective';

export const angularInitRun = [
  '$injector',
  ($injector) => {
    angular.module('contentful/init').getModule = $injector.get;
    angular.module('contentful/init').loaded = false;

    // ClientController and cf-app-container must be available immediately for the app to
    // load correctly. Its dependencies and the directives in the app container template
    // are also required. The other modules below can be imported lazily.
    componentsClientClientControllerEs6();
    statesConfigEs6();
    componentsAppContainerCfAppContainerDirectiveEs6();
    registerExceptionHandler();
    registerReactDirective();

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
