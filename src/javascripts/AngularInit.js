// https://weblogs.asp.net/dwahlin/dynamically-loading-controllers-and-views-with-angularjs-and-requirejs

import angular from 'angular';

// The imports in this file are automatically generated by tools/bin/angular_dependency_order.js. Modify with caution.
import classesSpaceContextEs6 from 'classes/spaceContext';
import componentsClientClientControllerEs6 from 'components/client/ClientController';
import statesConfigEs6 from 'states/config';
import componentsAppContainerCfAppContainerDirectiveEs6 from 'components/app_container/cfAppContainerDirective';
import uiFrameworkCfComponentBridgeDirectiveEs6 from 'ui/Framework/CfComponentBridgeDirective';
import componentsSharedPersistentNotificationCfPersistentNotificationDirectiveEs6 from 'components/shared/persistent_notification/cfPersistentNotificationDirective';

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
    uiFrameworkCfComponentBridgeDirectiveEs6();
    componentsSharedPersistentNotificationCfPersistentNotificationDirectiveEs6();

    const modules = await Promise.all([
      import(/* webpackMode: "eager" */ 'analytics/analyticsConsoleDirective'),
      import(/* webpackMode: "eager" */ 'app/ContentModel/Editor/addFieldDialogController'),
      import(/* webpackMode: "eager" */ 'services/modalDialogService'),
      import(/* webpackMode: "eager" */ 'utils/command/commandDirective'),
      import(/* webpackMode: "eager" */ 'components/field_dialog/fieldDialog'),
      import(/* webpackMode: "eager" */ 'app/ContentModel/Editor/contentTypeEditorController'),
      import(/* webpackMode: "eager" */ 'app/asset_editor/cfAssetEditorDirective'),
      import(/* webpackMode: "eager" */ 'app/entity_editor/bulk_editor/cfBulkEditorDirective'),
      import(
        /* webpackMode: "eager" */ 'app/entity_editor/bulk_editor/cfBulkEntityEditorDirective'
      ),
      import(/* webpackMode: "eager" */ 'app/entity_editor/cfEntityFieldDirective'),
      import(/* webpackMode: "eager" */ 'app/entity_editor/cfWidgetRendererDirective'),
      import(/* webpackMode: "eager" */ 'app/entity_editor/fieldLocaleController'),
      import(/* webpackMode: "eager" */ 'app/entity_editor/presenceHub'),
      import(/* webpackMode: "eager" */ 'app/entity_editor/stateController'),
      import(/* webpackMode: "eager" */ 'app/entry_editor/cfEntryEditorDirective'),
      import(/* webpackMode: "eager" */ 'app/entry_editor/cfWidgetApiDirective'),
      import(/* webpackMode: "eager" */ 'app/entry_editor/formWidgetsController'),
      import(/* webpackMode: "eager" */ 'components/client/activationEmailResendController'),
      import(/* webpackMode: "eager" */ 'components/client/dialogsInitController'),
      import(/* webpackMode: "eager" */ 'components/field_dialog/cfValidationSettingsDirective'),
      import(/* webpackMode: "eager" */ 'components/field_dialog/validationAssetTypesController'),
      import(/* webpackMode: "eager" */ 'components/field_dialog/validationLinkTypeController'),
      import(/* webpackMode: "eager" */ 'components/shared/cfSelectionDirective'),
      import(/* webpackMode: "eager" */ 'components/shared/endlessContainerDirective'),
      import(/* webpackMode: "eager" */ 'components/shared/listViewsController'),
      import(/* webpackMode: "eager" */ 'components/shared/space-wizard/SpaceWizardDirective'),
      import(
        /* webpackMode: "eager" */ 'components/shared/validation_error_display/cfErrorListDirective'
      ),
      import(
        /* webpackMode: "eager" */ 'components/shared/validation_error_display/cfErrorMessagesDirective'
      ),
      import(
        /* webpackMode: "eager" */ 'components/shared/validation_error_display/cfErrorPathDirective'
      ),
      import(
        /* webpackMode: "eager" */ 'components/shared/validation_error_display/errorPathController'
      ),
      import(/* webpackMode: "eager" */ 'components/shared/viewStateController'),
      import(/* webpackMode: "eager" */ 'components/tabs/asset_list/assetListActionsController'),
      import(/* webpackMode: "eager" */ 'components/tabs/asset_list/assetListController'),
      import(/* webpackMode: "eager" */ 'components/tabs/asset_list/assetListDirective'),
      import(/* webpackMode: "eager" */ 'services/promisedLoader'),
      import(/* webpackMode: "eager" */ 'components/tabs/asset_list/assetSearchController'),
      import(/* webpackMode: "eager" */ 'components/tabs/entry_list/displayFieldsController'),
      import(/* webpackMode: "eager" */ 'components/tabs/entry_list/entryListActionsController'),
      import(/* webpackMode: "eager" */ 'components/tabs/entry_list/entryListColumnsController'),
      import(/* webpackMode: "eager" */ 'components/tabs/entry_list/entryListController'),
      import(/* webpackMode: "eager" */ 'components/tabs/entry_list/entryListDirective'),
      import(/* webpackMode: "eager" */ 'components/tabs/entry_list/entryListSearchController'),
      import(/* webpackMode: "eager" */ 'services/batchPerformer'),
      import(/* webpackMode: "eager" */ 'components/tabs/listActionsController'),
      import(/* webpackMode: "eager" */ 'directives/bindHtmlCompileDirective'),
      import(/* webpackMode: "eager" */ 'directives/cfFocusOtInputDirective'),
      import(/* webpackMode: "eager" */ 'directives/cfSchemaDirectives'),
      import(/* webpackMode: "eager" */ 'directives/cfValidateDirective'),
      import(/* webpackMode: "eager" */ 'directives/watchersTogglerDirective'),
      import(/* webpackMode: "eager" */ 'filters'),
      import(/* webpackMode: "eager" */ 'forms/errors'),
      import(/* webpackMode: "eager" */ 'forms/validation'),
      import(/* webpackMode: "eager" */ 'forms'),
      import(/* webpackMode: "eager" */ 'navigation/stateChangeHandlers'),
      import(/* webpackMode: "eager" */ 'search/EntitySelector/entitySelectorController'),
      import(/* webpackMode: "eager" */ 'search/EntitySelector/entitySelectorDirective'),
      import(/* webpackMode: "eager" */ 'services/exceptionHandler'),
      import(/* webpackMode: "eager" */ 'states/cfSrefDirective'),
      import(/* webpackMode: "eager" */ 'ui/Framework/ReactDirective'),
      import(/* webpackMode: "eager" */ 'directives/cfIconDirective'),
      import(/* webpackMode: "eager" */ 'directives/cfUiTab'),
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
