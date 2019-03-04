// https://weblogs.asp.net/dwahlin/dynamically-loading-controllers-and-views-with-angularjs-and-requirejs

import _ from 'lodash';

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

      // Legacy values originally from lodash_timing.js
      $provide.value('debounce', _.debounce);
      $provide.value('throttle', _.throttle);
      $provide.value('defer', _.defer);
      $provide.value('delay', _.delay);
    }
  ])
  .run([
    '$injector',
    $injector => {
      const ngRequire = $injector.get;

      angular.module('contentful/init').getModule = ngRequire;

      // This list is automatically generated by tools/bin/angular_dependency_order.js. Do not modify.
      ngRequire('services/client.es6').default();
      ngRequire('services/localeStore.es6').default();
      ngRequire('data/userCache.es6').default();
      ngRequire('classes/spaceContext.es6').default();
      ngRequire('access_control/UserListHandler.es6').default();
      ngRequire('services/modalDialogService.es6').default();
      ngRequire('ui/command.es6').default();
      ngRequire('access_control/RoleRemover.es6').default();
      ngRequire('access_control/UserListDirective.es6').default();
      ngRequire('account/theAccountView.es6').default();
      ngRequire('access_control/RoleListDirective.es6').default();
      ngRequire('access_control/UserInvitationNoteDirectives.es6').default();
      ngRequire('access_control/UserSpaceInvitationController.es6').default();
      ngRequire('account/handleGatekeeperMessage.es6').default();
      ngRequire('account/cfAccountViewDirective.es6').default();
      ngRequire('account/cfNewOrganizationMembership.es6').default();
      ngRequire('analytics/analyticsConsole.es6').default();
      ngRequire('analytics/segment.es6').default();
      ngRequire('components/field_dialog/fieldDecorator.es6').default();
      ngRequire('services/errorMessageBuilder.es6').default();
      ngRequire('app/ContentModel/Editor/addFieldDialogController.es6').default();
      ngRequire('app/ContentModel/Editor/apiNameController.es6').default();
      ngRequire('app/ContentModel/Editor/cfApiNameShadowDirective.es6').default();
      ngRequire('components/field_dialog/fieldDialog.es6').default();
      ngRequire('app/ContentModel/Editor/metadataDialog.es6').default();
      ngRequire('app/ContentModel/Editor/contentTypeEditorController.es6').default();
      ngRequire('app/api/api_key_list/apiKeyListDirective.es6').default();
      ngRequire('app/asset_editor/cfAssetEditorDirective.es6').default();
      ngRequire('data/entries.es6').default();
      ngRequire('services/contentPreview.es6').default();
      ngRequire(
        'app/entity_editor/Components/StateChangeConfirmationDialog/cfStateChangeConfirmationDialog.es6'
      ).default();
      ngRequire('search/EntitySelector/entitySelector.es6').default();
      ngRequire('app/entity_editor/bulk_editor/cfBulkEditorDirective.es6').default();
      ngRequire('app/entity_editor/dataFields.es6').default();
      ngRequire('app/entity_editor/bulk_editor/cfBulkEntityEditorDirective.es6').default();
      ngRequire('app/entity_editor/cfEntityFieldDirective.es6').default();
      ngRequire('app/entity_editor/cfTestEntryEditorDirective.es6').default();
      ngRequire('components/app_container/entityCreator.es6').default();
      ngRequire('app/entity_editor/cfWidgetRendererDirective.es6').default();
      ngRequire('filters.es6').default();
      ngRequire('app/entity_editor/entityHelpers.es6').default();
      ngRequire('app/entity_editor/fieldLocaleController.es6').default();
      ngRequire('app/entity_editor/presenceHub.es6').default();
      ngRequire('navigation/stateChangeHandlers.es6').default();
      ngRequire('navigation/closeState.es6').default();
      ngRequire('app/entity_editor/stateController.es6').default();
      ngRequire('data/sharejs/utils.es6').default();
      ngRequire('app/entity_editor/stringField.es6').default();
      ngRequire('app/entry_editor/cfEntryEditorDirective.es6').default();
      ngRequire('app/entry_editor/cfWidgetApiDirective.es6').default();
      ngRequire('app/entry_editor/entryActionsController.es6').default();
      ngRequire('app/entry_editor/formWidgetsController.es6').default();
      ngRequire('app/home/cfTrackCopyEvent.es6').default();
      ngRequire('app/home/contactUs/contactUsSpaceHomeDirective.es6').default();
      ngRequire('app/home/developer_resources/cfDeveloperResourcesDirective.es6').default();
      ngRequire('app/home/onboarding_steps/cfOnboardingStepsDirective.es6').default();
      ngRequire('app/snapshots/cfSnapshotPresenter.es6').default();
      ngRequire('app/snapshots/cfSnapshotSelector.es6').default();
      ngRequire('app/snapshots/snapshotComparator.es6').default();
      ngRequire('app/widgets/cfBooleanEditorDirective.es6').default();
      ngRequire('app/widgets/cfCheckboxEditorDirective.es6').default();
      ngRequire('app/widgets/cfFileEditorDirective.es6').default();
      ngRequire('app/widgets/cfListInputEditorDirective.es6').default();
      ngRequire('app/widgets/cfMultiLineEditorDirective.es6').default();
      ngRequire('app/widgets/cfRatingEditorDirective.es6').default();
      ngRequire('app/widgets/TagEditor/cfTagEditorDirective.es6').default();
      ngRequire('app/widgets/datetime/cfEntryDatetimeEditorDirective.es6').default();
      ngRequire('app/widgets/dropdown/cfDropdownEditorDirective.es6').default();
      ngRequire('app/widgets/json/cfJsonEditorCodeEditorDirective.es6').default();
      ngRequire('app/widgets/json/cfJsonEditorDirective.es6').default();
      ngRequire('app/widgets/link/cfReferenceEditorDirective.es6').default();
      ngRequire('app/widgets/link/entityLinkDirectives.es6').default();
      ngRequire('app/widgets/location/cfLocationEditorDirective.es6').default();
      ngRequire('app/widgets/location/searchController.es6').default();
      ngRequire('app/widgets/number/cfNumberEditorDirective.es6').default();
      ngRequire('app/widgets/radio/cfRadioEditorDirective.es6').default();
      ngRequire('app/widgets/rich_text/cfRichTextEditorDirective.es6').default();
      ngRequire('app/widgets/shared/cfEditorCharacterInfoDirective.es6').default();
      ngRequire('app/widgets/single_line/cfSingleLineEditorDirective.es6').default();
      ngRequire('app/widgets/slug/cfSlugEditorDirective.es6').default();
      ngRequire('app/widgets/url/cfUrlEditorDirective.es6').default();
      ngRequire('classes/entityListCache.es6').default();
      ngRequire('components/CreateEntryButton/buttonDirective.es6').default();
      ngRequire('components/app_container/cfAppContainerDirective.es6').default();
      ngRequire('services/authorization.es6').default();
      ngRequire('components/client/ClientController.es6').default();
      ngRequire('services/activationEmailResender.es6').default();
      ngRequire('components/client/activationEmailResendController.es6').default();
      ngRequire('components/client/dialogsInitController.es6').default();
      ngRequire('components/field_dialog/cfValidationDateSelectDirective.es6').default();
      ngRequire('components/field_dialog/cfValidationSettingsDirective.es6').default();
      ngRequire('components/field_dialog/cfValidationValuesDirective.es6').default();
      ngRequire('components/field_dialog/imageDimensionsValidationController.es6').default();
      ngRequire('components/field_dialog/validationAssetTypesController.es6').default();
      ngRequire('components/field_dialog/validationLinkTypeController.es6').default();
      ngRequire('components/forms/datetime_editor/cfDatetimeEditorDirective.es6').default();
      ngRequire('components/forms/embedly_preview/cfEmbedlyPreviewDirective.es6').default();
      ngRequire('components/forms/field_alert/cfFieldAlertDirective.es6').default();
      ngRequire('components/roles/cfRolesForWalkMe.es6').default();
      ngRequire('components/shared/cfDropdownToggleDirective.es6').default();
      ngRequire('components/shared/cfImgLoadEvent.es6').default();
      ngRequire('components/shared/cfSelectionDirective.es6').default();
      ngRequire('components/shared/create_new_space/createNewSpaceDirective.es6').default();
      ngRequire('components/shared/dataSizeScaleController.es6').default();
      ngRequire('components/shared/endlessContainerDirective.es6').default();
      ngRequire('components/shared/knowledge_base_icon/cfKnowledgeBaseDirective.es6').default();
      ngRequire('components/shared/listViewsController.es6').default();
      ngRequire(
        'components/shared/persistent_notification/cfPersistentNotificationDirective.es6'
      ).default();
      ngRequire(
        'components/shared/search_results_paginator/searchResultsPaginatorDirective.es6'
      ).default();
      ngRequire('components/shared/space-wizard/SpaceWizardDirective.es6').default();
      ngRequire('components/shared/validation_error_display/cfErrorListDirective.es6').default();
      ngRequire(
        'components/shared/validation_error_display/cfErrorMessagesDirective.es6'
      ).default();
      ngRequire('components/shared/validation_error_display/cfErrorPathDirective.es6').default();
      ngRequire('components/shared/validation_error_display/errorPathController.es6').default();
      ngRequire('components/shared/viewStateController.es6').default();
      ngRequire('components/tabs/asset_list/assetListActionsController.es6').default();
      ngRequire('components/tabs/asset_list/assetListController.es6').default();
      ngRequire('components/tabs/asset_list/assetListDirective.es6').default();
      ngRequire('search/listQuery.es6').default();
      ngRequire('services/promisedLoader.es6').default();
      ngRequire('components/tabs/asset_list/assetSearchController.es6').default();
      ngRequire('components/tabs/content_type_list/contentTypeList.es6').default();
      ngRequire('components/tabs/entry_list/cfFieldDisplayDirective.es6').default();
      ngRequire('components/tabs/entry_list/displayFieldsController.es6').default();
      ngRequire('components/tabs/entry_list/entryListActionsController.es6').default();
      ngRequire('components/tabs/entry_list/entryListColumnsController.es6').default();
      ngRequire('components/tabs/entry_list/entryListController.es6').default();
      ngRequire('components/tabs/entry_list/entryListDirective.es6').default();
      ngRequire('utils/overridingRequestQueue.es6').default();
      ngRequire('components/tabs/entry_list/entryListSearchController.es6').default();
      ngRequire('components/tabs/entry_list/viewCustomizerDirective.es6').default();
      ngRequire('services/batchPerformer.es6').default();
      ngRequire('components/tabs/listActionsController.es6').default();
      ngRequire('debug/XHR/cfMockXhrConsoleDirective.es6').default();
      ngRequire('directives/bindHtmlCompileDirective.es6').default();
      ngRequire('directives/cfFocusOnRenderDirective.es6').default();
      ngRequire('directives/cfFocusOtInputDirective.es6').default();
      ngRequire('directives/cfSchemaDirectives.es6').default();
      ngRequire('directives/cfSelectAllInput.es6').default();
      ngRequire('directives/cfValidateDirective.es6').default();
      ngRequire('directives/cfWhenDisabled.es6').default();
      ngRequire('directives/tooltipDirective.es6').default();
      ngRequire('directives/watchersTogglerDirective.es6').default();
      ngRequire('forms/errors.es6').default();
      ngRequire('forms/validation.es6').default();
      ngRequire('forms.es6').default();
      ngRequire('markdown_editor/cfMarkdownActionDirective.es6').default();
      ngRequire('markdown_editor/cfMarkdownEditorDirective.es6').default();
      ngRequire('markdown_editor/cfZenmodeDirective.es6').default();
      ngRequire('markdown_editor/linkOrganizer.es6').default();
      ngRequire('markdown_editor/markdownPreviewDirective.es6').default();
      ngRequire('navigation/Breadcrumbs/BreadcrumbDirective.es6').default();
      ngRequire('navigation/Sidepanel/TriggerDirective.es6').default();
      ngRequire('navigation/Sidepanel/directive.es6').default();
      ngRequire('navigation/accountDropdownDirective.es6').default();
      ngRequire('navigation/organizationNavDirective.es6').default();
      ngRequire('navigation/profileNavDirective.es6').default();
      ngRequire('navigation/spaceNavBarDirective.es6').default();
      ngRequire('search/EntitySelector/entitySelectorController.es6').default();
      ngRequire('search/EntitySelector/entitySelectorDirective.es6').default();
      ngRequire('services/contentfulClient.es6').default();
      ngRequire('services/exceptionHandler.es6').default();
      ngRequire('services/hints.es6').default();
      ngRequire('states/cfSrefDirective.es6').default();
      ngRequire('states/config.es6').default();
      ngRequire('ui/Framework/AngularComponent.es6').default();
      ngRequire('ui/Framework/CfComponentBridgeDirective.es6').default();
      ngRequire('ui/Framework/ReactDirective.es6').default();
      ngRequire('ui/cf/cfThumbnailDirective.es6').default();
      ngRequire('ui/cfIconDirective.es6').default();
      ngRequire('ui/cfUiHint.es6').default();
      ngRequire('ui/cfUiSticky.es6').default();
      ngRequire('ui/cfUiTab.es6').default();
      ngRequire('ui/hideOnClickDirective.es6').default();
      ngRequire('ui/highlightMatchDirective.es6').default();
      ngRequire('ui/loader.es6').default();
      ngRequire('ui/onScrollDirective.es6').default();
      ngRequire('ui/setScrollDirective.es6').default();
      ngRequire('ui/sortable.es6').default();
    }
  ]);
