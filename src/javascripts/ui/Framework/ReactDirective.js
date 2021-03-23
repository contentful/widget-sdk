import React from 'react';
import ReactDOM from 'react-dom';
import { isFunction, get } from 'lodash';
import { registerDirective } from 'core/NgRegistry';
import angular from 'angular';
import * as logger from 'services/logger';

import * as Forma36Components from '@contentful/forma-36-react-components';

import * as uiComponentsIconEs6 from 'ui/Components/Icon';
import * as componentsSharedDocumentTitleEs6 from 'components/shared/DocumentTitle';
import { EntityFieldHeading } from 'app/entity_editor/EntityField/EntityFieldHeading';
import { EntityFieldControl } from 'app/entity_editor/EntityField/EntityFieldControl';
import * as Loader from 'ui/Loader';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { BulkEditor } from 'app/entity_editor/bulk_editor/BulkEditor';
import { EmptyState } from 'app/entity_editor/EmptyState';
import { CurrentSpaceAPIClientProvider } from 'core/services/APIClient/CurrentSpaceAPIClientContext';
import { EntryEditor } from 'app/entry_editor/EntryEditor';
import { AssetEditor } from 'app/asset_editor/AssetEditor';
import { SlideInEditor } from 'app/entity_editor/SlideInEditor/SlideInEditor';

// TODO refactor this function (6 arguments is too much)
function renderComponent(Component, props, scope, container) {
  scope.$evalAsync(() => {
    // this is the single place we mount all our components, so all
    // providers should be added here
    ReactDOM.render(
      <SpaceEnvContextProvider>
        <CurrentSpaceAPIClientProvider>
          <Component {...props} scope={scope} />
        </CurrentSpaceAPIClientProvider>
      </SpaceEnvContextProvider>,
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
    logger.captureError(e);
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
          renderComponent(ReactComponent, scopeProps, $scope, container);
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
    'ui/Components/Icon': uiComponentsIconEs6,
    'components/shared/DocumentTitle': componentsSharedDocumentTitleEs6,
    'app/entity_editor/bulk_editor/BulkEditor': { default: BulkEditor },
    'app/entry_editor/EntryEditor': { default: EntryEditor },
    'app/asset_editor/AssetEditor': { default: AssetEditor },
    'ui/Loader': Loader,
    'app/entity_editor/EntityField/EntityFieldHeading': { default: EntityFieldHeading },
    'app/entity_editor/EntityField/EntityFieldControl': { default: EntityFieldControl },
    'app/entity_editor/EmptyState': { default: EmptyState },
    'app/entity_editor/SlideInEditor/SlideInEditor': { default: SlideInEditor },
  };

  return get(allowedModules, name, null);
}
