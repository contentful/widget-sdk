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
        service: $provide.service,
        constant: $provide.constant
      };
    }
  ])
  .run([
    '$injector',
    $injector => {
      const ngRequire = $injector.get;

      angular.module('contentful/init').getModule = ngRequire;

      ngRequire('components/client/ClientController.es6');
      ngRequire('components/shared/space-wizard/SpaceWizardDirective.es6');

      ngRequire('access_control/PolicyBuilder.es6');
      ngRequire('access_control/RoleListDirective.es6');
      ngRequire('access_control/RoleRemover.es6');
      ngRequire('access_control/UserInvitationNoteDirectives.es6');
      ngRequire('access_control/UserListDirective.es6');
      ngRequire('access_control/UserListHandler.es6');
      ngRequire('access_control/UserSpaceInvitationController.es6');
    }
  ]);
