import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { isFunction, get } from 'lodash';
import { registerDirective } from 'NgRegistry';
import angular from 'angular';
import * as logger from 'services/logger';

import * as Forma36Components from '@contentful/forma-36-react-components';

import store from 'redux/store';

import * as accessControlAddUsersToSpaceNoteEs6 from 'access_control/AddUsersToSpaceNote';
import * as accessControlNoUsersToAddNoteEs6 from 'access_control/NoUsersToAddNote';
import * as accessControlUsersUserListEs6 from 'access_control/Users/UserList';
import * as componentsSharedKnowledgeBaseIconKnowledgeBaseEs6 from 'components/shared/knowledge_base_icon/KnowledgeBase';
import * as uiComponentsContactUsButtonEs6 from 'ui/Components/ContactUsButton';
import * as appContentListSaveViewDialogComponentEs6 from 'app/ContentList/SaveViewDialogComponent';
import * as uiComponentsIconEs6 from 'ui/Components/Icon';
import * as componentsSharedIe11DeprecationBannerEs6 from 'components/shared/IE11DeprecationBanner';
import * as appContentModelEditorContentTypesPageEs6 from 'app/ContentModel/Editor/ContentTypesPage';
import * as appOrganizationSettingsSsoSsoSetupEs6 from 'app/OrganizationSettings/SSO/SSOSetup';
import * as uiPagesSubscriptionOverviewIndexEs6 from 'ui/Pages/SubscriptionOverview';
import * as appOrganizationSettingsTeamsTeamPageEs6 from 'app/OrganizationSettings/Teams/TeamPage';
import * as accountUsageOrganizationUsageEs6 from 'account/usage/OrganizationUsage';
import * as appOrganizationSettingsUserInvitationsUserInvitationDetailUserInvitationDetailRouterEs6 from 'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter';
import * as appOrganizationSettingsUserInvitationsUserInvitationsListUserInvitationsListRouterEs6 from 'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter';
import * as appOrganizationSettingsUsersNewUserNewUserBridgeEs6 from 'app/OrganizationSettings/Users/NewUser/NewUserBridge';
import * as appOrganizationSettingsUsersUserDetailUserDetailRouteEs6 from 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute';
import * as appOrganizationSettingsUsersUsersListUserListRouteEs6 from 'app/OrganizationSettings/Users/UsersList/UserListRoute';
import * as appSpaceSettingsUsageSpaceUsageEs6 from 'app/SpaceSettings/Usage/SpaceUsage';
import * as componentsSharedDocumentTitleEs6 from 'components/shared/DocumentTitle';
import * as componentsSharedWorkbenchTitleEs6 from 'components/shared/WorkbenchTitle';
import * as appEntityEditorComponentsBackNavIndexEs6 from 'app/entity_editor/Components/BackNav';
import * as appEntityEditorEntityAuxToggleEs6 from 'app/entity_editor/EntityAuxToggle';
import * as appEntityEditorStatusNotificationEs6 from 'app/entity_editor/StatusNotification';
import * as appEntrySidebarEntrySidebarEs6 from 'app/EntrySidebar/EntrySidebar';
import * as widgetsWidgetRenderWarningEs6 from 'widgets/WidgetRenderWarning';
import * as widgetsExtensionIFrameRendererEs6 from 'widgets/ExtensionIFrameRenderer';
import * as appEntityEditorCollaboratorsIndexEs6 from 'app/entity_editor/Collaborators';
import * as appEntityEditorEntityCommentsToggleEs6 from 'app/entity_editor/EntityCommentsToggle';
import * as appEntryEditorCustomEditorExtensionRendererEs6 from 'app/entry_editor/CustomEditorExtensionRenderer';
import * as componentsTabsNoLocalizedFieldsAdviceIndexEs6 from 'components/tabs/NoLocalizedFieldsAdvice';
import * as appHomeSpaceHomePageEs6 from 'app/home/SpaceHomePage';
import * as appSettingsLocalesRoutesLocalesEditRouteEs6 from 'app/settings/locales/routes/LocalesEditRoute';
import * as appWidgetsRichTextReadOnlyRichTextEditorEs6 from 'app/widgets/rich_text/ReadOnlyRichTextEditor';
import * as componentsSharedRelativeDateTimeIndexEs6 from 'components/shared/RelativeDateTime';
import * as componentsFieldDialogValidationValuesEs6 from 'components/field_dialog/ValidationValues';
import * as componentsFieldDialogAppearanceFieldDialogAppearanceTabEs6 from 'components/field_dialog/appearance/FieldDialogAppearanceTab';
import * as componentsFieldDialogRichTextOptionsEs6 from 'components/field_dialog/RichTextOptions';
import * as componentsSharedLoadingModalEs6 from 'components/shared/LoadingModal';
import * as componentsSharedStackOnboardingScreensChoiceScreenEs6 from 'components/shared/stack-onboarding/screens/ChoiceScreen';
import * as componentsSharedSpaceWizardWizardEs6 from 'components/shared/space-wizard/Wizard';
import * as componentsTabsAssetListAddAssetButtonEs6 from 'components/tabs/asset_list/AddAssetButton';
import * as componentsTabsPluralizeEntityMessageEs6 from 'components/tabs/PluralizeEntityMessage';
import * as componentsRecordsResourceUsageIndexEs6 from 'components/RecordsResourceUsage';
import * as componentsSharedUserNameFormatterFetchAndFormatUserNameEs6 from 'components/shared/UserNameFormatter/FetchAndFormatUserName';
import * as uiComponentsPaginatorEs6 from 'ui/Components/Paginator';
import * as componentsTabsNoSearchResultsAdviceEs6 from 'components/tabs/NoSearchResultsAdvice';
import * as componentsTabsAssetListAssetsEmptyStateEs6 from 'components/tabs/asset_list/AssetsEmptyState';
import * as appJobsJobsPageLinkEs6 from 'app/jobs/JobsPageLink';
import * as componentsTabsEntryListEntryListEs6 from 'components/tabs/entry_list/EntryList';
import * as componentsTabsEntryListEmptyStatesIndexEs6 from 'components/tabs/entry_list/EmptyStates';
import * as componentsSharedQuickNavigationQuickNavWithFeatureFlagEs6 from 'components/shared/QuickNavigation/QuickNavWithFeatureFlag';
import * as searchEntitySelectorCreateEntityIndexEs6 from 'search/EntitySelector/CreateEntity';
import * as componentsSharedEnterpriseSpaceWizardEnterpriseSpaceWizardEs6 from 'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard';
import * as navigationModernStackOnboardingRelaunchEs6 from 'navigation/modernStackOnboardingRelaunch';
import * as componentsSharedUserInvitationEs6 from 'components/shared/UserInvitation';
import * as appUserProfileSettings from 'app/UserProfile/Settings';
import * as appUserSettingsSpaceMembershipsEs6 from 'app/UserSettings/SpaceMemberships';
import * as componentsTabsContentTypeListContentTypeListPageEs6 from 'components/tabs/content_type_list/ContentTypeListPage';
import * as appSpaceSettingsTeamsSpaceTeamsPageEs6 from 'app/SpaceSettings/Teams/SpaceTeamsPage';
import * as appSpaceSettingsTeamsAddTeamsAddTeamsRouterEs6 from 'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter';
import * as componentsSharedStackOnboardingScreensGetStartedScreenEs6 from 'components/shared/stack-onboarding/screens/GetStartedScreen';
import * as componentsSharedStackOnboardingScreensCopyScreenEs6 from 'components/shared/stack-onboarding/screens/CopyScreen';
import * as componentsSharedStackOnboardingScreensExploreScreenEs6 from 'components/shared/stack-onboarding/screens/ExploreScreen';
import * as componentsSharedStackOnboardingScreensDeployScreenEs6 from 'components/shared/stack-onboarding/screens/DeployScreen';
import * as componentsIe11DeprecationNoticeIndexEs6 from 'components/Ie11DeprecationNotice';
import * as accountAccountViewEs6 from 'account/AccountView';
import * as appEntityEditorBulkEditorTitleEs6 from 'app/entity_editor/bulk_editor/BulkEditorTitle';
import * as embedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import * as HeadingContextMenu from 'markdown_editor/components/HeadingContextMenu';
import * as InsertMediaComponent from 'markdown_editor/components/InsertMediaComponent';
import * as ActionComponent from 'markdown_editor/components/ActionComponent';

// TODO refactor this function (6 arguments is too much)
function renderComponent(Component, props, scope, container, store) {
  scope.$evalAsync(() => {
    // this is the single place we mount all our components, so all
    // providers should be added here
    ReactDOM.render(
      <Provider store={store}>
        <Component {...props} scope={scope} />
      </Provider>,
      container
    );
  });
}

function getReactComponent(name, logger) {
  // if name is a function assume it is component and return it
  if (isFunction(name)) {
    return name;
  }

  // a React component name must be specified
  if (!name) {
    throw new Error('ReactComponent name attribute must be specified');
  }

  // ensure the specified React component is accessible, and fail fast if it's not
  let reactComponent;

  try {
    reactComponent = requireComponent(name);
  } catch (e) {
    logger.logException(e);
  }

  if (!reactComponent) {
    throw Error(`Cannot find react component "${name}"`);
  }

  return reactComponent.default ? reactComponent.default : reactComponent;
}

function requireComponent(name) {
  // you can just provide name "@contentful/forma-36-react-components/TextLink"
  if (name.startsWith('@contentful/forma-36-react-components')) {
    const componentName = name.split('@contentful/forma-36-react-components/')[1];

    if (!componentName) {
      throw new Error(
        'You wanted to use forma-36-react-components, but did not provide element:::',
        name
      );
    }

    const Forma36Component = Forma36Components[componentName];

    if (!Forma36Component) {
      throw new Error(
        `You wanted to use @contentful/forma-36-react-components component, but "${componentName}" does not exist in it`
      );
    }

    return Forma36Component;
  } else if (getModule(name)) {
    const component = getModule(name);

    if (!component.default) {
      throw Error(
        'React component found but does not expose default export. Expose component using default keyword.'
      );
    }

    return component.default;
  } else {
    throw new Error(
      `Module ${name} not available to react-component. Make sure it's an allowed module.`
    );
  }
}

/**
 *
 * @param watchDepth (value of HTML watch-depth attribute)
 * @param scope (angular scope)
 *
 * Uses the watchDepth attribute to determine how to watch props on scope.
 * If watchDepth attribute is NOT reference or collection, watchDepth defaults to deep watching by value
 */
function watchProps(watchDepth, scope, watchExpressions, listener) {
  const supportsWatchCollection = isFunction(scope.$watchCollection);
  const supportsWatchGroup = isFunction(scope.$watchGroup);

  const watchGroupExpressions = [];
  watchExpressions.forEach(expr => {
    const actualExpr = getPropExpression(expr);
    const exprWatchDepth = getPropWatchDepth(watchDepth, expr);

    if (exprWatchDepth === 'collection' && supportsWatchCollection) {
      scope.$watchCollection(actualExpr, listener);
    } else if (exprWatchDepth === 'reference' && supportsWatchGroup) {
      watchGroupExpressions.push(actualExpr);
    } else {
      scope.$watch(actualExpr, listener, exprWatchDepth !== 'reference');
    }
  });

  if (watchGroupExpressions.length) {
    scope.$watchGroup(watchGroupExpressions, listener);
  }
}

// get prop expression from prop (string or array)
function getPropExpression(prop) {
  return Array.isArray(prop) ? prop[0] : prop;
}

// get watch depth of prop (string or array)
function getPropWatchDepth(defaultWatch, prop) {
  const customWatchDepth = Array.isArray(prop) && angular.isObject(prop[1]) && prop[1].watchDepth;
  return customWatchDepth || defaultWatch;
}

export default function register() {
  // NOTE: require below will need to be updated when moved to Webpack bundle

  /**
   * @description
   *
   * Mostly copied from ngReact – https://github.com/ngReact/ngReact/blob/master/ngReact.js#L179-L228
   * The reason for it's existence – we add all providers here, so all react components have same providers
   * Another use-case – special resolution, like for ui-components
   *
   * @usage[js]
   * {
   *   template: `
   *     <react-component name="app/home/welcome/Welcome" props="myController.props"></react-component>
   *     <react-component name="@ui-components-library/TextLink"></react-component>
   *   `
   * }
   *
   * Note: there are two types of watching available: by value (default) and by reference.
   * Reference is more performant, since check is essentially `===`, value traverses the
   * whole props object. Don't optimize rematurely!
   *
   * If you use reference, be aware that in order to update values, you need to replace
   * props object completely.
   */
  registerDirective('reactComponent', () => {
    return {
      restrict: 'E',
      replace: true,
      link: ($scope, $element, attrs) => {
        const container = $element[0];
        let ReactComponent;
        if (attrs.name) {
          ReactComponent = getReactComponent(attrs.name, logger);
        } else if (attrs.component) {
          ReactComponent = $scope.$eval(attrs.component);
        } else if (attrs.jsx) {
          ReactComponent = class Component extends React.Component {
            render() {
              return $scope.$eval(attrs.jsx);
            }
          };
        } else {
          throw new Error('Expect `component` or `name`');
        }

        const renderMyComponent = () => {
          const scopeProps = $scope.$eval(attrs.props);
          renderComponent(ReactComponent, scopeProps, $scope, container, store);
        };

        // If there are props, re-render when they change
        if (attrs.props) {
          watchProps(attrs.watchDepth, $scope, [attrs.props], renderMyComponent);
        } else {
          renderMyComponent();
        }

        // cleanup when scope is destroyed
        $scope.$on('$destroy', () => {
          if (!attrs.onScopeDestroy) {
            ReactDOM.unmountComponentAtNode(container);
          } else {
            $scope.$eval(attrs.onScopeDestroy)({
              unmountComponent: ReactDOM.unmountComponentAtNode.bind(this, container)
            });
          }
        });
      }
    };
  });
}

function getModule(name) {
  const allowedModules = {
    'access_control/AddUsersToSpaceNote': accessControlAddUsersToSpaceNoteEs6,
    'access_control/NoUsersToAddNote': accessControlNoUsersToAddNoteEs6,
    'access_control/Users/UserList': accessControlUsersUserListEs6,
    'components/shared/knowledge_base_icon/KnowledgeBase': componentsSharedKnowledgeBaseIconKnowledgeBaseEs6,
    'ui/Components/ContactUsButton': uiComponentsContactUsButtonEs6,
    'app/ContentList/SaveViewDialogComponent': appContentListSaveViewDialogComponentEs6,
    'ui/Components/Icon': uiComponentsIconEs6,
    'components/shared/IE11DeprecationBanner': componentsSharedIe11DeprecationBannerEs6,
    'app/ContentModel/Editor/ContentTypesPage': appContentModelEditorContentTypesPageEs6,
    'app/OrganizationSettings/SSO/SSOSetup': appOrganizationSettingsSsoSsoSetupEs6,
    'ui/Pages/SubscriptionOverview': uiPagesSubscriptionOverviewIndexEs6,
    'app/OrganizationSettings/Teams/TeamPage': appOrganizationSettingsTeamsTeamPageEs6,
    'account/usage/OrganizationUsage': accountUsageOrganizationUsageEs6,
    'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter': appOrganizationSettingsUserInvitationsUserInvitationDetailUserInvitationDetailRouterEs6,
    'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter': appOrganizationSettingsUserInvitationsUserInvitationsListUserInvitationsListRouterEs6,
    'app/OrganizationSettings/Users/NewUser/NewUserBridge': appOrganizationSettingsUsersNewUserNewUserBridgeEs6,
    'app/OrganizationSettings/Users/UserDetail/UserDetailRoute': appOrganizationSettingsUsersUserDetailUserDetailRouteEs6,
    'app/OrganizationSettings/Users/UsersList/UserListRoute': appOrganizationSettingsUsersUsersListUserListRouteEs6,
    'app/SpaceSettings/Usage/SpaceUsage': appSpaceSettingsUsageSpaceUsageEs6,
    'components/shared/DocumentTitle': componentsSharedDocumentTitleEs6,
    'components/shared/WorkbenchTitle': componentsSharedWorkbenchTitleEs6,
    'app/entity_editor/Components/BackNav': appEntityEditorComponentsBackNavIndexEs6,
    'app/entity_editor/EntityAuxToggle': appEntityEditorEntityAuxToggleEs6,
    'app/entity_editor/StatusNotification': appEntityEditorStatusNotificationEs6,
    'app/EntrySidebar/EntrySidebar': appEntrySidebarEntrySidebarEs6,
    'widgets/WidgetRenderWarning': widgetsWidgetRenderWarningEs6,
    'widgets/ExtensionIFrameRenderer': widgetsExtensionIFrameRendererEs6,
    'app/entity_editor/Collaborators': appEntityEditorCollaboratorsIndexEs6,
    'app/entity_editor/EntityCommentsToggle': appEntityEditorEntityCommentsToggleEs6,
    'app/entry_editor/CustomEditorExtensionRenderer': appEntryEditorCustomEditorExtensionRendererEs6,
    'components/tabs/NoLocalizedFieldsAdvice': componentsTabsNoLocalizedFieldsAdviceIndexEs6,
    'app/home/SpaceHomePage': appHomeSpaceHomePageEs6,
    'app/settings/locales/routes/LocalesEditRoute': appSettingsLocalesRoutesLocalesEditRouteEs6,
    'app/widgets/rich_text/ReadOnlyRichTextEditor': appWidgetsRichTextReadOnlyRichTextEditorEs6,
    'components/shared/RelativeDateTime': componentsSharedRelativeDateTimeIndexEs6,
    'components/field_dialog/ValidationValues': componentsFieldDialogValidationValuesEs6,
    'components/field_dialog/appearance/FieldDialogAppearanceTab': componentsFieldDialogAppearanceFieldDialogAppearanceTabEs6,
    'components/field_dialog/RichTextOptions': componentsFieldDialogRichTextOptionsEs6,
    'components/shared/LoadingModal': componentsSharedLoadingModalEs6,
    'components/shared/stack-onboarding/screens/ChoiceScreen': componentsSharedStackOnboardingScreensChoiceScreenEs6,
    'components/shared/space-wizard/Wizard': componentsSharedSpaceWizardWizardEs6,
    'components/tabs/asset_list/AddAssetButton': componentsTabsAssetListAddAssetButtonEs6,
    'components/tabs/PluralizeEntityMessage': componentsTabsPluralizeEntityMessageEs6,
    'components/RecordsResourceUsage': componentsRecordsResourceUsageIndexEs6,
    'components/shared/UserNameFormatter/FetchAndFormatUserName': componentsSharedUserNameFormatterFetchAndFormatUserNameEs6,
    'ui/Components/Paginator': uiComponentsPaginatorEs6,
    'components/tabs/NoSearchResultsAdvice': componentsTabsNoSearchResultsAdviceEs6,
    'components/tabs/asset_list/AssetsEmptyState': componentsTabsAssetListAssetsEmptyStateEs6,
    'app/jobs/JobsPageLink': appJobsJobsPageLinkEs6,
    'components/tabs/entry_list/EntryList': componentsTabsEntryListEntryListEs6,
    'components/tabs/entry_list/EmptyStates': componentsTabsEntryListEmptyStatesIndexEs6,
    'components/shared/QuickNavigation/QuickNavWithFeatureFlag': componentsSharedQuickNavigationQuickNavWithFeatureFlagEs6,
    'search/EntitySelector/CreateEntity': searchEntitySelectorCreateEntityIndexEs6,
    'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard': componentsSharedEnterpriseSpaceWizardEnterpriseSpaceWizardEs6,
    'navigation/modernStackOnboardingRelaunch': navigationModernStackOnboardingRelaunchEs6,
    'components/shared/UserInvitation': componentsSharedUserInvitationEs6,
    'app/UserProfile/Settings': appUserProfileSettings,
    'app/UserSettings/SpaceMemberships': appUserSettingsSpaceMembershipsEs6,
    'components/tabs/content_type_list/ContentTypeListPage': componentsTabsContentTypeListContentTypeListPageEs6,
    'app/SpaceSettings/Teams/SpaceTeamsPage': appSpaceSettingsTeamsSpaceTeamsPageEs6,
    'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter': appSpaceSettingsTeamsAddTeamsAddTeamsRouterEs6,
    'components/shared/stack-onboarding/screens/GetStartedScreen': componentsSharedStackOnboardingScreensGetStartedScreenEs6,
    'components/shared/stack-onboarding/screens/CopyScreen': componentsSharedStackOnboardingScreensCopyScreenEs6,
    'components/shared/stack-onboarding/screens/ExploreScreen': componentsSharedStackOnboardingScreensExploreScreenEs6,
    'components/shared/stack-onboarding/screens/DeployScreen': componentsSharedStackOnboardingScreensDeployScreenEs6,
    'components/Ie11DeprecationNotice': componentsIe11DeprecationNoticeIndexEs6,
    'account/AccountView': accountAccountViewEs6,
    'app/entity_editor/bulk_editor/BulkEditorTitle': appEntityEditorBulkEditorTitleEs6,
    'components/forms/embedly_preview/EmbedlyPreview': embedlyPreview,
    'markdown_editor/components/HeadingContextMenu': HeadingContextMenu,
    'markdown_editor/components/InsertMediaComponent': InsertMediaComponent,
    'markdown_editor/components/ActionComponent': ActionComponent
  };

  return get(allowedModules, name, null);
}
