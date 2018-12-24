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
        provider: $provide.provider,
        value: $provide.value
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
      ngRequire('analytics/bugsnag.es6');

      // access_control
      ngRequire('access_control/PolicyBuilder.es6');
      ngRequire('access_control/RoleListDirective.es6');
      ngRequire('access_control/RoleRemover.es6');
      ngRequire('access_control/UserInvitationNoteDirectives.es6');
      ngRequire('access_control/UserListDirective.es6');
      ngRequire('access_control/UserListHandler.es6');
      ngRequire('access_control/UserSpaceInvitationController.es6');

      // account
      ngRequire('account/cfAccountViewDirective.es6');
      ngRequire('account/cfNewOrganizationMembership.es6');
      ngRequire('account/handleGatekeeperMessage.es6');
      ngRequire('account/theAccountView.es6');

      // analytics
      ngRequire('analytics/analyticsConsole.es6');
      ngRequire('analytics/events/customWidgets.es6');
      ngRequire('analytics/events/persistentNotification.es6');
      ngRequire('analytics/events/versioning.es6');
      ngRequire('analytics/fontsDotCom.es6');
      ngRequire('analytics/segment.es6');

      // classes
      ngRequire('classes/entityListCache.es6');
      ngRequire('classes/spaceContext.es6');

      // data
      ngRequire('data/document/status.es6');

      // debug
      ngRequire('debug/XHR/cfMockXhrConsoleDirective.es6');

      // directives
      ngRequire('directives/bindHtmlCompileDirective.es6');
      ngRequire('directives/cfFocusOnRenderDirective.es6');
      ngRequire('directives/cfFocusOtInputDirective.es6');
      ngRequire('directives/cfRelativeDatetime.es6');
      ngRequire('directives/cfSchemaDirectives.es6');
      ngRequire('directives/cfSelectAllInput.es6');
      ngRequire('directives/cfValidateDirective.es6');
      ngRequire('directives/cfWhenDisabled.es6');
      ngRequire('directives/tooltipDirective.es6');
      ngRequire('directives/watchersTogglerDirective.es6');

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

      // data (cf.data)
      ngRequire('data/apiClient.es6');
      ngRequire('data/contentTypes.es6');
      ngRequire('data/editingInterfaces.es6');
      ngRequire('data/entries.es6');
      ngRequire('data/previewEnvironmentsCache.es6');
      ngRequire('data/streamHasSet.es6');
      ngRequire('data/userCache.es6');
      ngRequire('data/editing_interfaces/assetInterface.es6');
      ngRequire('data/editing_interfaces/transformer.es6');
      ngRequire('data/sharejs/utils.es6');

      // app (cf.app)
      ngRequire('app/entity_editor/cfEntityFieldDirective.es6');
      ngRequire('app/entity_editor/cfWidgetRendererDirective.es6');
      ngRequire('app/entity_editor/entityHelpers.es6');
      ngRequire('app/entity_editor/stringField.es6');
      ngRequire('app/snapshots/cfSnapshotPresenter.es6');
      ngRequire('app/snapshots/cfSnapshotSelector.es6');
      ngRequire('app/snapshots/snapshotComparator.es6');
      ngRequire('app/snapshots/snapshotDoc.es6');
      ngRequire('app/snapshots/snapshotSidebarListDirective.es6');
      ngRequire('app/widgets/cfBooleanEditorDirective.es6');
      ngRequire('app/widgets/cfCheckboxEditorDirective.es6');
      ngRequire('app/widgets/cfListInputEditorDirective.es6');
      ngRequire('app/widgets/cfMultiLineEditorDirective.es6');
      ngRequire('app/widgets/cfRatingEditorDirective.es6');
      ngRequire('app/widgets/cfTagEditorDirective.es6');
      ngRequire('app/widgets/datetime/cfEntryDatetimeEditorDirective.es6');
      ngRequire('app/widgets/datetime/data.es6');
      ngRequire('app/widgets/dropdown/cfDropdownEditorDirective.es6');
      ngRequire('app/widgets/json/cfJsonEditorCodeEditorDirective.es6');
      ngRequire('app/widgets/json/cfJsonEditorDirective.es6');
      ngRequire('app/widgets/link/cfReferenceEditorDirective.es6');
      ngRequire('app/widgets/link/entityLinkDirectives.es6');
      ngRequire('app/widgets/location/cfLocationEditorDirective.es6');
      ngRequire('app/widgets/location/searchController.es6');
      ngRequire('app/widgets/radio/cfRadioEditorDirective.es6');
      ngRequire('app/widgets/rich_text/cfRichTextEditorDirective.es6');
      ngRequire('navigation/stateChangeHandlers.es6');
      ngRequire('states/cfSrefDirective.es6');

      // utils (cf.utils)
      ngRequire('utils/encoder.es6');
      ngRequire('utils/overridingRequestQueue.es6');
    }
  ])
  .factory('require', [
    '$injector',
    $injector => {
      // This factory is used by many modules and registering it using
      // registerFactory doesn't work well. This will be removed once all
      // modules are registered and any potential references to `require`
      // are moved to $injector.get.
      return $injector.get;
    }
  ]);
