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

      // markdown_editor
      ngRequire('markdown_editor/cfMarkdownActionDirective.es6');
      ngRequire('markdown_editor/cfMarkdownEditorDirective.es6');
      ngRequire('markdown_editor/cfZenmodeDirective.es6');
      ngRequire('markdown_editor/linkOrganizer.es6');
      ngRequire('markdown_editor/markdownPreviewDirective.es6');

      // navigation
      ngRequire('navigation/Breadcrumbs/BreadcrumbDirective.es6');
      ngRequire('navigation/Sidepanel/TriggerDirective.es6');
      ngRequire('navigation/Sidepanel/directive.es6');
      ngRequire('navigation/accountDropdownDirective.es6');
      ngRequire('navigation/closeState.es6');
      ngRequire('navigation/confirmLeaveEditor.es6');
      ngRequire('navigation/organizationNavDirective.es6');
      ngRequire('navigation/profileNavDirective.es6');
      ngRequire('navigation/spaceNavBarDirective.es6');

      // search
      ngRequire('search/EntitySelector/entitySelector.es6');
      ngRequire('search/EntitySelector/entitySelectorController.es6');
      ngRequire('search/EntitySelector/entitySelectorDirective.es6');
      ngRequire('search/cachedParser.es6');
      ngRequire('search/listQuery.es6');
      ngRequire('search/systemFields.es6');

      // components
      ngRequire('components/CreateEntryButton/buttonDirective.es6');
      ngRequire('components/authors_help/authorsHelpDirective.es6');
      ngRequire('components/client/activationEmailResendController.es6');
      ngRequire('components/client/dialogsInitController.es6');
      ngRequire('components/client/subscriptionNotifier.es6');
      ngRequire('components/forms/autocomplete_results/cfAutocompleteResultsController.es6');
      ngRequire('components/forms/autocomplete_results/cfAutocompleteResultsDirective.es6');
      ngRequire('components/forms/datetime_editor/cfDatetimeEditorDirective.es6');
      ngRequire('components/forms/embedly_preview/cfEmbedlyPreviewDirective.es6');
      ngRequire('components/forms/field_alert/cfFieldAlertDirective.es6');
      ngRequire('components/roles/cfRolesForWalkMe.es6');
      ngRequire('components/shared/cfDropdownToggleDirective.es6');
      ngRequire('components/shared/cfImgLoadEvent.es6');
      ngRequire('components/shared/cfSelectionDirective.es6');
      ngRequire('components/shared/cfUserDirective.es6');
      ngRequire('components/shared/create_new_space/createNewSpaceDirective.es6');
      ngRequire('components/shared/dataSizeScaleController.es6');
      ngRequire('components/shared/endlessContainerDirective.es6');
      ngRequire('components/shared/entity_info_panel/entityInfoPanelDirective.es6');
      ngRequire('components/shared/knowledge_base_icon/cfKnowledgeBaseDirective.es6');
      ngRequire('components/shared/listViewsController.es6');
      ngRequire('components/shared/persistent_notification/cfPersistentNotificationDirective.es6');
      ngRequire('components/shared/search_results_paginator/searchResultsPaginatorDirective.es6');
      ngRequire('components/shared/validation_error_display/cfErrorListDirective.es6');
      ngRequire('components/shared/validation_error_display/cfErrorMessagesDirective.es6');
      ngRequire('components/shared/validation_error_display/cfErrorPathDirective.es6');
      ngRequire('components/shared/validation_error_display/errorPathController.es6');
      ngRequire('components/shared/viewStateController.es6');
      ngRequire('components/field_dialog/cfPositionRelativeToWidgetListDirective.es6');
      ngRequire('components/field_dialog/cfValidationDateSelectDirective.es6');
      ngRequire('components/field_dialog/cfValidationSettingsDirective.es6');
      ngRequire('components/field_dialog/cfValidationValuesDirective.es6');
      ngRequire('components/field_dialog/fieldDecorator.es6');
      ngRequire('components/field_dialog/fieldDialog.es6');
      ngRequire('components/field_dialog/imageDimensionsValidationController.es6');
      ngRequire('components/field_dialog/validationAssetTypesController.es6');
      ngRequire('components/field_dialog/validationDecorator.es6');
      ngRequire('components/field_dialog/validationLinkTypeController.es6');

      ngRequire('components/tabs/asset_list/assetListActionsController.es6');
      ngRequire('components/tabs/asset_list/assetListController.es6');
      ngRequire('components/tabs/asset_list/assetListDirective.es6');
      ngRequire('components/tabs/asset_list/assetSearchController.es6');
      ngRequire('components/tabs/content_type_list/contentTypeList.es6');
      ngRequire('components/tabs/entry_list/cfFieldDisplayDirective.es6');
      ngRequire('components/tabs/entry_list/displayFieldsController.es6');
      ngRequire('components/tabs/entry_list/entryListActionsController.es6');
      ngRequire('components/tabs/entry_list/entryListColumnsController.es6');
      ngRequire('components/tabs/entry_list/entryListController.es6');
      ngRequire('components/tabs/entry_list/entryListDirective.es6');
      ngRequire('components/tabs/entry_list/entryListSearchController.es6');
      ngRequire('components/tabs/entry_list/viewCustomizerDirective.es6');
      ngRequire('components/tabs/listActionsController.es6');

      ngRequire('components/app_container/cfAppContainerDirective.es6');
      ngRequire('components/app_container/entityCreator.es6');

      // services
      ngRequire('services/activationEmailResender.es6');
      ngRequire('services/authorization.es6');
      ngRequire('services/batchPerformer.es6');
      ngRequire('services/client.es6');
      ngRequire('services/contentfulClient.es6');
      ngRequire('services/contentPreview.es6');
      ngRequire('services/editingInterfacesHelpers.es6');
      ngRequire('services/errorMessageBuilder.es6');
      ngRequire('services/exceptionHandler.es6');
      ngRequire('services/features.es6');
      ngRequire('services/fieldFactory.es6');
      ngRequire('services/hints.es6');
      ngRequire('services/intercom.es6');
      ngRequire('services/lazyLoader.es6');
      ngRequire('services/localeStore.es6');
      ngRequire('services/logger.es6');
      ngRequire('services/modalDialogService.es6');
      ngRequire('services/paywallOpener.es6');
      ngRequire('services/promisedLoader.es6');
      ngRequire('services/searchQueryAutocompletions.es6');
      ngRequire('services/slug.es6');
      ngRequire('services/subscriptionPlanRecommender.es6');
      ngRequire('services/userAgent.es6');
      ngRequire('services/validationDialogErrorMessages.es6');
      ngRequire('services/validationViews.es6');

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
