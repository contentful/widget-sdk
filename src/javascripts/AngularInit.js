// https://weblogs.asp.net/dwahlin/dynamically-loading-controllers-and-views-with-angularjs-and-requirejs

import _ from 'lodash';
import angular from 'angular';

// The imports in this file are automatically generated by tools/bin/angular_dependency_order.js. Modify with caution.
import classesSpaceContextEs6 from 'classes/spaceContext.es6';
import componentsClientClientControllerEs6 from 'components/client/ClientController.es6';
import statesConfigEs6 from 'states/config.es6';
import componentsAppContainerCfAppContainerDirectiveEs6 from 'components/app_container/cfAppContainerDirective.es6';
import navigationSidepanelDirectiveEs6 from 'navigation/Sidepanel/directive.es6';
import uiFrameworkCfComponentBridgeDirectiveEs6 from 'ui/Framework/CfComponentBridgeDirective.es6';
import navigationSidepanelTriggerDirectiveEs6 from 'navigation/Sidepanel/TriggerDirective.es6';
import navigationAccountDropdownDirectiveEs6 from 'navigation/accountDropdownDirective.es6';
import componentsSharedPersistentNotificationCfPersistentNotificationDirectiveEs6 from 'components/shared/persistent_notification/cfPersistentNotificationDirective.es6';

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
    navigationSidepanelDirectiveEs6();
    uiFrameworkCfComponentBridgeDirectiveEs6();
    navigationSidepanelTriggerDirectiveEs6();
    navigationAccountDropdownDirectiveEs6();
    componentsSharedPersistentNotificationCfPersistentNotificationDirectiveEs6();

    const modules = await Promise.all([
      import('analytics/analyticsConsoleDirective'),
      import('services/modalDialogService.es6'),
      import('ui/command.es6'),
      import('access_control/RoleRemover.es6'),
      import('access_control/Users/UserListDirective.es6'),
      import('access_control/RoleListDirective.es6'),
      import('access_control/UserSpaceInvitationController.es6'),
      import('account/cfNewOrganizationMembership.es6'),
      import('app/ContentModel/Editor/addFieldDialogController.es6'),
      import('app/ContentModel/Editor/apiNameController.es6'),
      import('app/ContentModel/Editor/cfApiNameShadowDirective.es6'),
      import('navigation/stateChangeHandlers.es6'),
      import('navigation/closeState.es6'),
      import('components/field_dialog/fieldDialog.es6'),
      import('app/ContentModel/Editor/contentTypeEditorController.es6'),
      import('app/asset_editor/cfAssetEditorDirective.es6'),
      import('app/entity_editor/bulk_editor/cfBulkEditorDirective.es6'),
      import('app/entity_editor/bulk_editor/cfBulkEntityEditorDirective.es6'),
      import('app/entity_editor/cfEntityFieldDirective.es6'),
      import('app/entity_editor/cfTestEntryEditorDirective.es6'),
      import('app/entity_editor/cfWidgetRendererDirective.es6'),
      import('app/entity_editor/fieldLocaleController.es6'),
      import('app/entity_editor/presenceHub.es6'),
      import('app/entity_editor/stateController.es6'),
      import('app/entry_editor/cfEntryEditorDirective.es6'),
      import('app/entry_editor/cfWidgetApiDirective.es6'),
      import('app/entry_editor/entryActionsController.es6'),
      import('app/entry_editor/formWidgetsController.es6'),
      import('app/home/cfTrackCopyEvent.es6'),
      import('app/snapshots/cfSnapshotPresenter.es6'),
      import('app/snapshots/cfSnapshotSelector.es6'),
      import('app/snapshots/snapshotComparator.es6'),
      import('app/widgets/cfFileEditorDirective.es6'),
      import('app/widgets/datetime/cfEntryDatetimeEditorDirective.es6'),
      import('app/widgets/json/cfJsonEditorCodeEditorDirective.es6'),
      import('app/widgets/json/cfJsonEditorDirective.es6'),
      import('app/widgets/link/entityLinkDirectives.es6'),
      import('app/widgets/location/cfLocationEditorDirective.es6'),
      import('app/widgets/location/searchController.es6'),
      import('app/widgets/shared/cfEditorCharacterInfoDirective.es6'),
      import('app/widgets/slug/cfSlugEditorDirective.es6'),
      import('app/widgets/url/cfUrlEditorDirective.es6'),
      import('components/CreateEntryButton/buttonDirective.es6'),
      import('services/activationEmailResender.es6'),
      import('components/client/activationEmailResendController.es6'),
      import('components/client/dialogsInitController.es6'),
      import('components/field_dialog/cfValidationDateSelectDirective.es6'),
      import('components/field_dialog/cfValidationSettingsDirective.es6'),
      import('components/field_dialog/imageDimensionsValidationController.es6'),
      import('components/field_dialog/validationAssetTypesController.es6'),
      import('components/field_dialog/validationLinkTypeController.es6'),
      import('components/forms/datetime_editor/cfDatetimeEditorDirective.es6'),
      import('components/forms/field_alert/cfFieldAlertDirective.es6'),
      import('components/roles/cfRolesForWalkMe.es6'),
      import('components/shared/cfImgLoadEvent.es6'),
      import('components/shared/cfSelectionDirective.es6'),
      import('components/shared/create_new_space/createNewSpaceDirective.es6'),
      import('components/shared/dataSizeScaleController.es6'),
      import('components/shared/endlessContainerDirective.es6'),
      import('components/shared/listViewsController.es6'),
      import('components/shared/space-wizard/SpaceWizardDirective.es6'),
      import('components/shared/validation_error_display/cfErrorListDirective.es6'),
      import('components/shared/validation_error_display/cfErrorMessagesDirective.es6'),
      import('components/shared/validation_error_display/cfErrorPathDirective.es6'),
      import('components/shared/validation_error_display/errorPathController.es6'),
      import('components/shared/viewStateController.es6'),
      import('components/tabs/asset_list/assetListActionsController.es6'),
      import('components/tabs/asset_list/assetListController.es6'),
      import('components/tabs/asset_list/assetListDirective.es6'),
      import('services/promisedLoader.es6'),
      import('components/tabs/asset_list/assetSearchController.es6'),
      import('components/tabs/entry_list/displayFieldsController.es6'),
      import('components/tabs/entry_list/entryListActionsController.es6'),
      import('components/tabs/entry_list/entryListColumnsController.es6'),
      import('components/tabs/entry_list/entryListController.es6'),
      import('components/tabs/entry_list/entryListDirective.es6'),
      import('utils/overridingRequestQueue.es6'),
      import('components/tabs/entry_list/entryListSearchController.es6'),
      import('services/batchPerformer.es6'),
      import('components/tabs/listActionsController.es6'),
      import('directives/bindHtmlCompileDirective.es6'),
      import('directives/cfFocusOnRenderDirective.es6'),
      import('directives/cfFocusOtInputDirective.es6'),
      import('directives/cfSchemaDirectives.es6'),
      import('directives/cfThumbnailDirective.es6'),
      import('directives/cfValidateDirective.es6'),
      import('directives/tooltipDirective.es6'),
      import('directives/watchersTogglerDirective.es6'),
      import('filters.es6'),
      import('forms/errors.es6'),
      import('forms/validation.es6'),
      import('forms.es6'),
      import('markdown_editor/cfMarkdownActionDirective.es6'),
      import('markdown_editor/cfMarkdownEditorDirective.es6'),
      import('markdown_editor/cfZenmodeDirective.es6'),
      import('markdown_editor/markdownPreviewDirective.es6'),
      import('navigation/Breadcrumbs/BreadcrumbDirective.es6'),
      import('navigation/organizationNavDirective.es6'),
      import('navigation/profileNavDirective.es6'),
      import('navigation/spaceNavBarDirective.es6'),
      import('search/EntitySelector/entitySelectorController.es6'),
      import('search/EntitySelector/entitySelectorDirective.es6'),
      import('services/exceptionHandler.es6'),
      import('states/cfSrefDirective.es6'),
      import('ui/Framework/ReactDirective.es6'),
      import('ui/cfIconDirective.es6'),
      import('ui/cfUiTab.es6'),
      import('ui/highlightMatchDirective.es6'),
      import('ui/loader.es6')
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
