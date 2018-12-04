// https://weblogs.asp.net/dwahlin/dynamically-loading-controllers-and-views-with-angularjs-and-requirejs

angular
  .module('contentful/init')
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
        service: $provide.service
      };
    }
  ])
  .run([
    '$injector',
    $injector => {
      const require = $injector.get;

      require('components/client/ClientController.es6');
      require('components/shared/space-wizard/SpaceWizardDirective.es6');
    }
  ]);
