import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { isFunction, get } from 'lodash';
import { registerDirective } from 'NgRegistry.es6';
import angular from 'angular';
import * as logger from 'services/logger.es6';

import * as Forma36Components from '@contentful/forma-36-react-components';

import appContentListSaveViewDialogComponentes6 from 'app/ContentList/SaveViewDialogComponent.es6';
import appContentModelEditorContentTypesPagees6 from 'app/ContentModel/Editor/ContentTypesPage.es6';
import apphomecontactUsTemplatees6 from 'app/home/contactUs/Template.es6';
import apphomewelcomeWelcomees6 from 'app/home/welcome/Welcome.es6';
import appInputDialogComponentes6 from 'app/InputDialogComponent.es6';
import appsettingslocalesroutesLocalesListRoutees6 from 'app/settings/locales/routes/LocalesListRoute.es6';
import appsettingslocalesroutesLocalesNewRoutees6 from 'app/settings/locales/routes/LocalesNewRoute.es6';
import appsettingslocalesroutesLocalesEditRoutees6 from 'app/settings/locales/routes/LocalesEditRoute.es6';
import appsettingsspaceSpaceSettingsRoutees6 from 'app/settings/space/SpaceSettingsRoute.es6';
import appwidgetsrichtextReadOnlyRichTextEditores6 from 'app/widgets/rich_text/ReadOnlyRichTextEditor.es6';
import appSpaceSettingsUsageSpaceUsagees6 from 'app/SpaceSettings/Usage/SpaceUsage.es6';
import appapiApiKeysHeaderes6 from 'app/api/ApiKeysHeader.es6';
import appapiApiKeysNavigationes6 from 'app/api/ApiKeysNavigation.es6';
import appapiapikeylistApiKeyListes6 from 'app/api/api_key_list/ApiKeyList.es6';
import appentityeditorStatusNotificationes6 from 'app/entity_editor/StatusNotification.es6';
import appentityeditorComponentsBackNavindexes6 from 'app/entity_editor/Components/BackNav/index.es6';
import appentityeditorCollaboratorsindexes6 from 'app/entity_editor/Collaborators/index.es6';
import appEntrySidebarEntrySidebares6 from 'app/EntrySidebar/EntrySidebar.es6';
import appentryeditorCustomEditorExtensionRendereres6 from 'app/entry_editor/CustomEditorExtensionRenderer.es6';
import appjobsJobsPageLinkes6 from 'app/jobs/JobsPageLink.es6';
import appapiKeyEditorBoilerplatees6 from 'app/api/KeyEditor/Boilerplate.es6';
import appapiKeyEditorContactUses6 from 'app/api/KeyEditor/ContactUs.es6';
import apphomeAuthorEditorSpaceHomees6 from 'app/home/AuthorEditorSpaceHome.es6';
import apphomeUpgradePricinges6 from 'app/home/UpgradePricing.es6';
import apphomedeveloperresourcesDeveloperResourcesComponentes6 from 'app/home/developer_resources/DeveloperResourcesComponent.es6';
import appSpaceSettingsTeamsSpaceTeamsPagees6 from 'app/SpaceSettings/Teams/SpaceTeamsPage.es6';
import appSpaceSettingsTeamsAddTeamsAddTeamsRouteres6 from 'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter.es6';
import appOrganizationSettingsSSOSSOSetupes6 from 'app/OrganizationSettings/SSO/SSOSetup.es6';
import appOrganizationSettingsUserInvitationsUserInvitationDetailUserInvitationDetailRouteres6 from 'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter.es6';
import appOrganizationSettingsUserInvitationsUserInvitationsListUserInvitationsListRouteres6 from 'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter.es6';
import appOrganizationSettingsUsersNewUserNewUserBridgees6 from 'app/OrganizationSettings/Users/NewUser/NewUserBridge.es6';
import appOrganizationSettingsUsersUserDetailUserDetailRoutees6 from 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute.es6';
import appOrganizationSettingsUsersUsersListUserListRoutees6 from 'app/OrganizationSettings/Users/UsersList/UserListRoute.es6';
import appOrganizationSettingsTeamsTeamPagees6 from 'app/OrganizationSettings/Teams/TeamPage.es6';
import apphomewelcomeOnboardingWithTeaes6 from 'app/home/welcome/OnboardingWithTea.es6';
import accountusageOrganizationUsagees6 from 'account/usage/OrganizationUsage.es6';
import accountAccountViewes6 from 'account/AccountView.es6';
import accesscontrolRoleEditores6 from 'access_control/RoleEditor.es6';
import componentssharedIE11DeprecationBanneres6 from 'components/shared/IE11DeprecationBanner.es6';
import componentssharedstackonboardingscreensChoiceScreenes6 from 'components/shared/stack-onboarding/screens/ChoiceScreen.es6';
import componentssharedLoadingModales6 from 'components/shared/LoadingModal.es6';
import componentssharedspacewizardWizardes6 from 'components/shared/space-wizard/Wizard.es6';
import componentssharedenterprisespacewizardEnterpriseSpaceWizardes6 from 'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard.es6';
import componentssharedstackonboardingscreensCopyScreenes6 from 'components/shared/stack-onboarding/screens/CopyScreen.es6';
import componentssharedstackonboardingscreensExploreScreenes6 from 'components/shared/stack-onboarding/screens/ExploreScreen.es6';
import componentssharedstackonboardingscreensDeployScreenes6 from 'components/shared/stack-onboarding/screens/DeployScreen.es6';
import componentssharedUserInvitationes6 from 'components/shared/UserInvitation.es6';
import componentssharedDocumentTitlees6 from 'components/shared/DocumentTitle.es6';
import componentssharedRelativeDateTimeindexes6 from 'components/shared/RelativeDateTime/index.es6';
import componentssharedUserNameFormatterFetchAndFormatUserNamees6 from 'components/shared/UserNameFormatter/FetchAndFormatUserName.es6';
import componentsfielddialogRichTextOptionses6 from 'components/field_dialog/RichTextOptions.es6';
import componentsfielddialogValidationValueses6 from 'components/field_dialog/ValidationValues.es6';
import componentsfielddialogappearanceFieldDialogAppearanceTabes6 from 'components/field_dialog/appearance/FieldDialogAppearanceTab.es6';
import componentstabscontenttypelistContentTypeListPagees6 from 'components/tabs/content_type_list/ContentTypeListPage.es6';
import componentstabsNoLocalizedFieldsAdviceindexes6 from 'components/tabs/NoLocalizedFieldsAdvice/index.es6';
import componentstabsassetlistAddAssetButtones6 from 'components/tabs/asset_list/AddAssetButton.es6';
import componentstabsNoSearchResultsAdvicees6 from 'components/tabs/NoSearchResultsAdvice.es6';
import componentstabsassetlistAssetsEmptyStatees6 from 'components/tabs/asset_list/AssetsEmptyState.es6';
import componentstabsentrylistEntryListes6 from 'components/tabs/entry_list/EntryList.es6';
import componentstabsentrylistEmptyStatesindexes6 from 'components/tabs/entry_list/EmptyStates/index.es6';
import componentsRecordsResourceUsageindexes6 from 'components/RecordsResourceUsage/index.es6';
import componentssharedknowledgebaseiconKnowledgeBasees6 from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import componentssharedstackonboardingnextstepsDevNextStepsContaineres6 from 'components/shared/stack-onboarding/next_steps/DevNextStepsContainer.es6';
import componentssharedQuickNavigationQuickNavWithFeatureFlages6 from 'components/shared/QuickNavigation/QuickNavWithFeatureFlag.es6';
import widgetsWidgetRenderWarninges6 from 'widgets/WidgetRenderWarning.es6';
import widgetsExtensionIFrameRendereres6 from 'widgets/ExtensionIFrameRenderer.es6';
import uiComponentsIcones6 from 'ui/Components/Icon.es6';
import uiComponentsPaginatores6 from 'ui/Components/Paginator.es6';
import uiPagesSubscriptionOverviewindexes6 from 'ui/Pages/SubscriptionOverview/index.es6';
import navigationmodernStackOnboardingRelaunches6 from 'navigation/modernStackOnboardingRelaunch.es6';
import navigationSidepanelTriggeres6 from 'navigation/Sidepanel/Trigger.es6';
import searchEntitySelectorCreateEntityindexes6 from 'search/EntitySelector/CreateEntity/index.es6';
import uiComponentsContactUsButtones6 from 'ui/Components/ContactUsButton.es6';

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
    return getModule(name);
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
   *     <react-component name="app/home/welcome/Welcome.es6" props="myController.props"></react-component>
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
  registerDirective('reactComponent', [
    'redux/store.es6',
    function({ default: store }) {
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
    }
  ]);
}

function getModule(name) {
  const allowedModules = {
    'app/ContentList/SaveViewDialogComponent.es6': appContentListSaveViewDialogComponentes6,
    'app/ContentModel/Editor/ContentTypesPage.es6': appContentModelEditorContentTypesPagees6,
    'app/home/contactUs/Template.es6': apphomecontactUsTemplatees6,
    'app/home/welcome/Welcome.es6': apphomewelcomeWelcomees6,
    'app/InputDialogComponent.es6': appInputDialogComponentes6,
    'app/settings/locales/routes/LocalesListRoute.es6': appsettingslocalesroutesLocalesListRoutees6,
    'app/settings/locales/routes/LocalesNewRoute.es6': appsettingslocalesroutesLocalesNewRoutees6,
    'app/settings/locales/routes/LocalesEditRoute.es6': appsettingslocalesroutesLocalesEditRoutees6,
    'app/settings/space/SpaceSettingsRoute.es6': appsettingsspaceSpaceSettingsRoutees6,
    'app/widgets/rich_text/ReadOnlyRichTextEditor.es6': appwidgetsrichtextReadOnlyRichTextEditores6,
    'app/SpaceSettings/Usage/SpaceUsage.es6': appSpaceSettingsUsageSpaceUsagees6,
    'app/api/ApiKeysHeader.es6': appapiApiKeysHeaderes6,
    'app/api/ApiKeysNavigation.es6': appapiApiKeysNavigationes6,
    'app/api/api_key_list/ApiKeyList.es6': appapiapikeylistApiKeyListes6,
    'app/entity_editor/StatusNotification.es6': appentityeditorStatusNotificationes6,
    'app/entity_editor/Components/BackNav/index.es6': appentityeditorComponentsBackNavindexes6,
    'app/entity_editor/Collaborators/index.es6': appentityeditorCollaboratorsindexes6,
    'app/EntrySidebar/EntrySidebar.es6': appEntrySidebarEntrySidebares6,
    'app/entry_editor/CustomEditorExtensionRenderer.es6': appentryeditorCustomEditorExtensionRendereres6,
    'app/jobs/JobsPageLink.es6': appjobsJobsPageLinkes6,
    'app/api/KeyEditor/Boilerplate.es6': appapiKeyEditorBoilerplatees6,
    'app/api/KeyEditor/ContactUs.es6': appapiKeyEditorContactUses6,
    'app/home/AuthorEditorSpaceHome.es6': apphomeAuthorEditorSpaceHomees6,
    'app/home/UpgradePricing.es6': apphomeUpgradePricinges6,
    'app/home/developer_resources/DeveloperResourcesComponent.es6': apphomedeveloperresourcesDeveloperResourcesComponentes6,
    'app/SpaceSettings/Teams/SpaceTeamsPage.es6': appSpaceSettingsTeamsSpaceTeamsPagees6,
    'app/SpaceSettings/Teams/AddTeams/AddTeamsRouter.es6': appSpaceSettingsTeamsAddTeamsAddTeamsRouteres6,
    'app/OrganizationSettings/SSO/SSOSetup.es6': appOrganizationSettingsSSOSSOSetupes6,
    'app/OrganizationSettings/UserInvitations/UserInvitationDetail/UserInvitationDetailRouter.es6': appOrganizationSettingsUserInvitationsUserInvitationDetailUserInvitationDetailRouteres6,
    'app/OrganizationSettings/UserInvitations/UserInvitationsList/UserInvitationsListRouter.es6': appOrganizationSettingsUserInvitationsUserInvitationsListUserInvitationsListRouteres6,
    'app/OrganizationSettings/Users/NewUser/NewUserBridge.es6': appOrganizationSettingsUsersNewUserNewUserBridgees6,
    'app/OrganizationSettings/Users/UserDetail/UserDetailRoute.es6': appOrganizationSettingsUsersUserDetailUserDetailRoutees6,
    'app/OrganizationSettings/Users/UsersList/UserListRoute.es6': appOrganizationSettingsUsersUsersListUserListRoutees6,
    'app/OrganizationSettings/Teams/TeamPage.es6': appOrganizationSettingsTeamsTeamPagees6,
    'app/home/welcome/OnboardingWithTea.es6': apphomewelcomeOnboardingWithTeaes6,
    'account/usage/OrganizationUsage.es6': accountusageOrganizationUsagees6,
    'account/AccountView.es6': accountAccountViewes6,
    'access_control/RoleEditor.es6': accesscontrolRoleEditores6,
    'components/shared/IE11DeprecationBanner.es6': componentssharedIE11DeprecationBanneres6,
    'components/shared/stack-onboarding/screens/ChoiceScreen.es6': componentssharedstackonboardingscreensChoiceScreenes6,
    'components/shared/LoadingModal.es6': componentssharedLoadingModales6,
    'components/shared/space-wizard/Wizard.es6': componentssharedspacewizardWizardes6,
    'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard.es6': componentssharedenterprisespacewizardEnterpriseSpaceWizardes6,
    'components/shared/stack-onboarding/screens/CopyScreen.es6': componentssharedstackonboardingscreensCopyScreenes6,
    'components/shared/stack-onboarding/screens/ExploreScreen.es6': componentssharedstackonboardingscreensExploreScreenes6,
    'components/shared/stack-onboarding/screens/DeployScreen.es6': componentssharedstackonboardingscreensDeployScreenes6,
    'components/shared/UserInvitation.es6': componentssharedUserInvitationes6,
    'components/shared/DocumentTitle.es6': componentssharedDocumentTitlees6,
    'components/shared/RelativeDateTime/index.es6': componentssharedRelativeDateTimeindexes6,
    'components/shared/UserNameFormatter/FetchAndFormatUserName.es6': componentssharedUserNameFormatterFetchAndFormatUserNamees6,
    'components/field_dialog/RichTextOptions.es6': componentsfielddialogRichTextOptionses6,
    'components/field_dialog/ValidationValues.es6': componentsfielddialogValidationValueses6,
    'components/field_dialog/appearance/FieldDialogAppearanceTab.es6': componentsfielddialogappearanceFieldDialogAppearanceTabes6,
    'components/tabs/content_type_list/ContentTypeListPage.es6': componentstabscontenttypelistContentTypeListPagees6,
    'components/tabs/NoLocalizedFieldsAdvice/index.es6': componentstabsNoLocalizedFieldsAdviceindexes6,
    'components/tabs/asset_list/AddAssetButton.es6': componentstabsassetlistAddAssetButtones6,
    'components/tabs/NoSearchResultsAdvice.es6': componentstabsNoSearchResultsAdvicees6,
    'components/tabs/asset_list/AssetsEmptyState.es6': componentstabsassetlistAssetsEmptyStatees6,
    'components/tabs/entry_list/EntryList.es6': componentstabsentrylistEntryListes6,
    'components/tabs/entry_list/EmptyStates/index.es6': componentstabsentrylistEmptyStatesindexes6,
    'components/RecordsResourceUsage/index.es6': componentsRecordsResourceUsageindexes6,
    'components/shared/knowledge_base_icon/KnowledgeBase.es6': componentssharedknowledgebaseiconKnowledgeBasees6,
    'components/shared/stack-onboarding/next_steps/DevNextStepsContainer.es6': componentssharedstackonboardingnextstepsDevNextStepsContaineres6,
    'components/shared/QuickNavigation/QuickNavWithFeatureFlag.es6': componentssharedQuickNavigationQuickNavWithFeatureFlages6,
    'widgets/WidgetRenderWarning.es6': widgetsWidgetRenderWarninges6,
    'widgets/ExtensionIFrameRenderer.es6': widgetsExtensionIFrameRendereres6,
    'ui/Components/Icon.es6': uiComponentsIcones6,
    'ui/Components/Paginator.es6': uiComponentsPaginatores6,
    'ui/Pages/SubscriptionOverview/index.es6': uiPagesSubscriptionOverviewindexes6,
    'navigation/modernStackOnboardingRelaunch.es6': navigationmodernStackOnboardingRelaunches6,
    'navigation/Sidepanel/Trigger.es6': navigationSidepanelTriggeres6,
    'search/EntitySelector/CreateEntity/index.es6': searchEntitySelectorCreateEntityindexes6,
    'ui/Components/ContactUsButton.es6': uiComponentsContactUsButtones6
  };

  return get(allowedModules, name, null);
}
