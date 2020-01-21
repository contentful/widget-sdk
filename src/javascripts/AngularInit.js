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
  async $injector => {
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
      import('access_control/UserSpaceInvitationController'),
      import('account/cfNewOrganizationMembership'),
      import('analytics/analyticsConsoleDirective'),
      import('app/ContentModel/Editor/addFieldDialogController'),
      import('services/modalDialogService'),
      import('utils/command/commandDirective'),
      import('components/field_dialog/fieldDialog'),
      import('app/ContentModel/Editor/contentTypeEditorController'),
      import('app/asset_editor/cfAssetEditorDirective'),
      import('app/entity_editor/bulk_editor/cfBulkEditorDirective'),
      import('app/entity_editor/bulk_editor/cfBulkEntityEditorDirective'),
      import('app/entity_editor/cfEntityFieldDirective'),
      import('app/entity_editor/cfWidgetRendererDirective'),
      import('app/entity_editor/fieldLocaleController'),
      import('app/entity_editor/presenceHub'),
      import('app/entity_editor/stateController'),
      import('app/entry_editor/cfEntryEditorDirective'),
      import('app/entry_editor/cfWidgetApiDirective'),
      import('app/entry_editor/formWidgetsController'),
      import('app/snapshots/cfSnapshotPresenter'),
      import('app/snapshots/cfSnapshotSelector'),
      import('app/snapshots/snapshotComparator'),
      import('app/widgets/link/entityLinkDirectives'),
      import('app/widgets/shared/cfEditorCharacterInfoDirective'),
      import('app/widgets/slug/cfSlugEditorDirective'),
      import('components/CreateEntryButton/buttonDirective'),
      import('components/client/activationEmailResendController'),
      import('components/client/dialogsInitController'),
      import('components/field_dialog/cfValidationDateSelectDirective'),
      import('components/field_dialog/cfValidationSettingsDirective'),
      import('components/field_dialog/imageDimensionsValidationController'),
      import('components/field_dialog/validationAssetTypesController'),
      import('components/field_dialog/validationLinkTypeController'),
      import('components/forms/datetime_editor/cfDatetimeEditorDirective'),
      import('components/shared/cfSelectionDirective'),
      import('components/shared/create_new_space/createNewSpaceDirective'),
      import('components/shared/dataSizeScaleController'),
      import('components/shared/endlessContainerDirective'),
      import('components/shared/listViewsController'),
      import('components/shared/space-wizard/SpaceWizardDirective'),
      import('components/shared/validation_error_display/cfErrorListDirective'),
      import('components/shared/validation_error_display/cfErrorMessagesDirective'),
      import('components/shared/validation_error_display/cfErrorPathDirective'),
      import('components/shared/validation_error_display/errorPathController'),
      import('components/shared/viewStateController'),
      import('components/tabs/asset_list/assetListActionsController'),
      import('components/tabs/asset_list/assetListController'),
      import('components/tabs/asset_list/assetListDirective'),
      import('services/promisedLoader'),
      import('components/tabs/asset_list/assetSearchController'),
      import('components/tabs/entry_list/displayFieldsController'),
      import('components/tabs/entry_list/entryListActionsController'),
      import('components/tabs/entry_list/entryListColumnsController'),
      import('components/tabs/entry_list/entryListController'),
      import('components/tabs/entry_list/entryListDirective'),
      import('utils/overridingRequestQueue'),
      import('components/tabs/entry_list/entryListSearchController'),
      import('services/batchPerformer'),
      import('components/tabs/listActionsController'),
      import('directives/bindHtmlCompileDirective'),
      import('directives/cfFocusOnRenderDirective'),
      import('directives/cfFocusOtInputDirective'),
      import('directives/cfSchemaDirectives'),
      import('directives/cfValidateDirective'),
      import('directives/watchersTogglerDirective'),
      import('filters'),
      import('forms/errors'),
      import('forms/validation'),
      import('forms'),
      import('markdown_editor/cfMarkdownEditorDirective'),
      import('markdown_editor/cfZenmodeDirective'),
      import('markdown_editor/markdownPreviewDirective'),
      import('navigation/stateChangeHandlers'),
      import('search/EntitySelector/entitySelectorController'),
      import('search/EntitySelector/entitySelectorDirective'),
      import('services/exceptionHandler'),
      import('states/cfSrefDirective'),
      import('ui/Framework/ReactDirective'),
      import('ui/cfIconDirective'),
      import('ui/cfUiTab'),
      import('ui/loader')
    ]);
    modules.forEach(module => module.default());

    angular.module('contentful/init').loaded = true;
  }
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
        value: $provide.value
      };
    }
  ])
  .run(angularInitRun).name;
