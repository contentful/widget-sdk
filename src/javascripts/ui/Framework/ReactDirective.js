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
import * as componentsSharedKnowledgeBaseIconKnowledgeBaseEs6 from 'components/shared/knowledge_base_icon/KnowledgeBase';
import * as uiComponentsContactUsButtonEs6 from 'ui/Components/ContactUsButton';
import * as uiComponentsNavigationIcon from 'ui/Components/NavigationIcon';
import * as appContentListSaveViewDialogComponentEs6 from 'app/ContentList/SaveViewDialogComponent';
import * as uiComponentsIconEs6 from 'ui/Components/Icon';
import * as componentsSharedDocumentTitleEs6 from 'components/shared/DocumentTitle';
import * as componentsSharedWorkbenchTitleEs6 from 'components/shared/WorkbenchTitle';
import * as appEntityEditorComponentsBackNavIndexEs6 from 'app/entity_editor/Components/BackNav';
import * as appEntityEditorEntrySecondaryActions from 'app/entry_editor/EntryTitlebar/EntrySecondaryActions/EntrySecondaryActions';
import * as appEntityEditorStatusNotificationEs6 from 'app/entity_editor/StatusNotification';
import * as appEntrySidebarEntrySidebarEs6 from 'app/EntrySidebar/EntrySidebar';
import * as appEntityEditorCollaboratorsIndexEs6 from 'app/entity_editor/Collaborators';
import * as appEntryEditorCustomEditorExtensionRendererEs6 from 'app/entry_editor/CustomEditorExtensionRenderer';
import * as componentsTabsNoLocalizedFieldsAdviceIndexEs6 from 'components/tabs/NoLocalizedFieldsAdvice';
import * as appHomeSpaceHomePageEs6 from 'app/home/SpaceHomePage';
import * as appSettingsLocalesRoutesLocalesEditRouteEs6 from 'app/settings/locales/routes/LocalesEditRoute';
import * as appWidgetsRichTextReadOnlyRichTextEditorEs6 from 'app/widgets/RichText/ReadOnlyRichTextEditor';
import * as componentsSharedRelativeDateTimeIndexEs6 from 'components/shared/RelativeDateTime';
import * as componentsFieldDialogValidationValuesEs6 from 'components/field_dialog/ValidationValues';
import * as componentsFieldDialogAppearanceFieldDialogAppearanceTabEs6 from 'components/field_dialog/appearance/FieldDialogAppearanceTab';
import * as componentsFieldDialogRichTextOptionsEs6 from 'components/field_dialog/RichTextOptions';
import * as componentsSharedSpaceWizardWizardEs6 from 'components/shared/space-wizard/Wizard';
import * as componentsTabsAssetListAddAssetButtonEs6 from 'components/tabs/asset_list/AddAssetButton';
import * as componentsTabsPluralizeEntityMessageEs6 from 'components/tabs/PluralizeEntityMessage';
import * as componentsRecordsResourceUsageIndexEs6 from 'components/RecordsResourceUsage';
import * as componentsSharedUserNameFormatterFetchAndFormatUserNameEs6 from 'components/shared/UserNameFormatter/FetchAndFormatUserName';
import * as uiComponentsPaginatorEs6 from 'ui/Components/Paginator';
import * as componentsTabsNoSearchResultsAdviceEs6 from 'components/tabs/NoSearchResultsAdvice';
import * as componentsTabsAssetListAssetsEmptyStateEs6 from 'components/tabs/asset_list/AssetsEmptyState';
import * as appScheduledActionsPageLinkEs6 from 'app/ScheduledActions/ScheduledActionsPageLink';
import * as componentsTabsEntryListEntryListEs6 from 'components/tabs/entry_list/EntryList';
import * as componentsTabsEntryListEmptyStatesIndexEs6 from 'components/tabs/entry_list/EmptyStates';
import * as searchEntitySelectorCreateEntityIndexEs6 from 'search/EntitySelector/CreateEntity';
import * as componentsSharedEnterpriseSpaceWizardEnterpriseSpaceWizardEs6 from 'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard';
import * as navigationModernStackOnboardingRelaunchEs6 from 'navigation/modernStackOnboardingRelaunch';
import * as appEntityEditorBulkEditorTitleEs6 from 'app/entity_editor/bulk_editor/BulkEditorTitle';
import * as appEntityEditorBulkEntityEditorActionsDropdownEs6 from 'app/entity_editor/bulk_editor/BulkEntityEditorActionsDropdown';
import * as appEntityEditorBulkEntityEditorStatusDropdownEs6 from 'app/entity_editor/bulk_editor/BulkEntityEditorStatusDropdown';
import * as embedlyPreview from 'components/forms/embedly_preview/EmbedlyPreview';
import * as FieldDialogSettingsComponent from 'components/field_dialog/components/FieldDialogSettingsComponent';
import * as ThumbnailComponent from 'components/Thumbnail/Thumbnail';
import * as SizeValidation from 'components/field_dialog/validations/SizeValidation';
import * as LinkedEntitiesBadge from 'app/entity_editor/Components/FetchLinksToEntity/LinkedEntitiesBadge';
import * as LinkedEntitiesValidation from 'components/field_dialog/validations/LinkedEntitiesValidation';
import * as CreateEntryButton from 'components/CreateEntryButton/CreateEntryButton';
import * as CreateEntryLinkButton from 'components/CreateEntryButton/CreateEntryLinkButton';
import * as AssetFileSizeValidation from 'components/field_dialog/validations/AssetFileSizeValidation';
import * as AssetImageDimensionsValidations from 'components/field_dialog/validations/AssetImageDimensionsValidations';
import * as Loader from 'ui/Loader';
import * as RegExpValidation from 'components/field_dialog/validations/RegExpValidation';
import * as UserLink from 'app/widgets/link/UserLink';
import * as ProhibitRegExpValidation from 'components/field_dialog/validations/ProhibitRegExpValidation';
import * as AssetLink from 'app/widgets/link/AssetLink';
import * as EntryLink from 'app/widgets/link/EntryLink';
import * as ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer';
import * as DateRangeValidation from 'components/field_dialog/validations/DateRangeValidation';
import * as BulkActionsRowAdapter from 'components/tabs/BulkActionsRowAdapter';

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
  watchExpressions.forEach((expr) => {
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
   *     <react-component name="@contentful/forma-36-react-components/TextLink"></react-component>
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
              unmountComponent: ReactDOM.unmountComponentAtNode.bind(this, container),
            });
          }
        });
      },
    };
  });
}

function getModule(name) {
  const allowedModules = {
    'access_control/AddUsersToSpaceNote': accessControlAddUsersToSpaceNoteEs6,
    'access_control/NoUsersToAddNote': accessControlNoUsersToAddNoteEs6,
    'components/shared/knowledge_base_icon/KnowledgeBase': componentsSharedKnowledgeBaseIconKnowledgeBaseEs6,
    'ui/Components/ContactUsButton': uiComponentsContactUsButtonEs6,
    'ui/Components/NavigationIcon': uiComponentsNavigationIcon,
    'app/ContentList/SaveViewDialogComponent': appContentListSaveViewDialogComponentEs6,
    'ui/Components/Icon': uiComponentsIconEs6,
    'components/shared/DocumentTitle': componentsSharedDocumentTitleEs6,
    'components/shared/WorkbenchTitle': componentsSharedWorkbenchTitleEs6,
    'app/entity_editor/Components/BackNav': appEntityEditorComponentsBackNavIndexEs6,
    'app/entity_editor/EntryTitlebar/EntrySecondaryActions': appEntityEditorEntrySecondaryActions,
    'app/entity_editor/StatusNotification': appEntityEditorStatusNotificationEs6,
    'app/EntrySidebar/EntrySidebar': appEntrySidebarEntrySidebarEs6,
    'app/entity_editor/Collaborators': appEntityEditorCollaboratorsIndexEs6,
    'app/entry_editor/CustomEditorExtensionRenderer': appEntryEditorCustomEditorExtensionRendererEs6,
    'components/tabs/NoLocalizedFieldsAdvice': componentsTabsNoLocalizedFieldsAdviceIndexEs6,
    'app/home/SpaceHomePage': appHomeSpaceHomePageEs6,
    'app/settings/locales/routes/LocalesEditRoute': appSettingsLocalesRoutesLocalesEditRouteEs6,
    'app/widgets/RichText/ReadOnlyRichTextEditor': appWidgetsRichTextReadOnlyRichTextEditorEs6,
    'components/shared/RelativeDateTime': componentsSharedRelativeDateTimeIndexEs6,
    'components/field_dialog/ValidationValues': componentsFieldDialogValidationValuesEs6,
    'components/field_dialog/appearance/FieldDialogAppearanceTab': componentsFieldDialogAppearanceFieldDialogAppearanceTabEs6,
    'components/field_dialog/RichTextOptions': componentsFieldDialogRichTextOptionsEs6,
    'components/shared/space-wizard/Wizard': componentsSharedSpaceWizardWizardEs6,
    'components/tabs/asset_list/AddAssetButton': componentsTabsAssetListAddAssetButtonEs6,
    'components/tabs/PluralizeEntityMessage': componentsTabsPluralizeEntityMessageEs6,
    'components/RecordsResourceUsage': componentsRecordsResourceUsageIndexEs6,
    'components/shared/UserNameFormatter/FetchAndFormatUserName': componentsSharedUserNameFormatterFetchAndFormatUserNameEs6,
    'ui/Components/Paginator': uiComponentsPaginatorEs6,
    'components/tabs/NoSearchResultsAdvice': componentsTabsNoSearchResultsAdviceEs6,
    'components/tabs/asset_list/AssetsEmptyState': componentsTabsAssetListAssetsEmptyStateEs6,
    'app/ScheduledActions/ScheduledActionsPageLink': appScheduledActionsPageLinkEs6,
    'components/tabs/entry_list/EntryList': componentsTabsEntryListEntryListEs6,
    'components/tabs/entry_list/EmptyStates': componentsTabsEntryListEmptyStatesIndexEs6,
    'search/EntitySelector/CreateEntity': searchEntitySelectorCreateEntityIndexEs6,
    'components/shared/enterprise-space-wizard/EnterpriseSpaceWizard': componentsSharedEnterpriseSpaceWizardEnterpriseSpaceWizardEs6,
    'navigation/modernStackOnboardingRelaunch': navigationModernStackOnboardingRelaunchEs6,
    'app/entity_editor/bulk_editor/BulkEditorTitle': appEntityEditorBulkEditorTitleEs6,
    'app/entity_editor/bulk_editor/BulkEntityEditorActionsDropdown': appEntityEditorBulkEntityEditorActionsDropdownEs6,
    'app/entity_editor/bulk_editor/BulkEntityEditorStatusDropdown': appEntityEditorBulkEntityEditorStatusDropdownEs6,
    'components/forms/embedly_preview/EmbedlyPreview': embedlyPreview,
    'components/field_dialog/components/FieldDialogSettingsComponent': FieldDialogSettingsComponent,
    'components/Thumbnail/Thumbnail': ThumbnailComponent,
    'components/field_dialog/validations/SizeValidation': SizeValidation,
    'app/entity_editor/Components/FetchLinksToEntity/LinkedEntitiesBadge': LinkedEntitiesBadge,
    'components/field_dialog/validations/LinkedEntitiesValidation': LinkedEntitiesValidation,
    'components/CreateEntryButton/CreateEntryButton': CreateEntryButton,
    'components/CreateEntryButton/CreateEntryLinkButton': CreateEntryLinkButton,
    'components/field_dialog/validations/AssetFileSizeValidation': AssetFileSizeValidation,
    'components/field_dialog/validations/AssetImageDimensionsValidations': AssetImageDimensionsValidations,
    'ui/Loader': Loader,
    'components/field_dialog/validations/RegExpValidation': RegExpValidation,
    'app/widgets/link/UserLink': UserLink,
    'components/field_dialog/validations/ProhibitRegExpValidation': ProhibitRegExpValidation,
    'app/widgets/link/AssetLink': AssetLink,
    'app/widgets/link/EntryLink': EntryLink,
    'widgets/ExtensionIFrameRenderer': ExtensionIFrameRenderer,
    'components/field_dialog/validations/DateRangeValidation': DateRangeValidation,
    'components/tabs/BulkActionsRowAdapter': BulkActionsRowAdapter,
  };

  return get(allowedModules, name, null);
}
