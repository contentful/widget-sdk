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
        constant: $provide.constant,
        provider: $provide.provider
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

      // access_control
      ngRequire('access_control/PolicyBuilder.es6');
      ngRequire('access_control/RoleListDirective.es6');
      ngRequire('access_control/RoleRemover.es6');
      ngRequire('access_control/UserInvitationNoteDirectives.es6');
      ngRequire('access_control/UserListDirective.es6');
      ngRequire('access_control/UserListHandler.es6');
      ngRequire('access_control/UserSpaceInvitationController.es6');

      // ui (cf.ui)
      ngRequire('ui/cfIconDirective.es6');
      ngRequire('ui/cfUiHint.es6');
      ngRequire('ui/cfUiSticky.es6');
      ngRequire('ui/cfUiTab.es6');
      ngRequire('ui/command.es6');
      ngRequire('ui/datepicker.es6');
      ngRequire('ui/hideOnClickDirective.es6');
      ngRequire('ui/highlightMatchDirective.es6');
      ngRequire('ui/inputUpdater.es6');
      ngRequire('ui/loader.es6');
      ngRequire('ui/sortable.es6');

      // forms (cf.forms)
      ngRequire('forms.es6');
      ngRequire('forms/errors.es6');
      ngRequire('forms/validation.es6');
    }
  ]);
