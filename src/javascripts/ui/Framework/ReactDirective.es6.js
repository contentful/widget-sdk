import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { isFunction } from 'lodash';
import { registerDirective } from 'NgRegistry.es6';
import angular from 'angular';

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
  '$injector',
  'logger',
  'redux/store.es6',
  function($injector, logger, { default: store }) {
    return {
      restrict: 'E',
      replace: true,
      link: ($scope, $element, attrs) => {
        const element = $element[0];
        let reactComponent;
        if (attrs.name) {
          reactComponent = getReactComponent(attrs.name, $injector.get, logger);
        } else if (attrs.component) {
          reactComponent = $scope.$eval(attrs.component);
        } else if (attrs.jsx) {
          reactComponent = class Component extends React.Component {
            render() {
              return $scope.$eval(attrs.jsx);
            }
          };
        } else {
          throw new Error('Expect `component` or `name`');
        }

        const renderMyComponent = () => {
          const scopeProps = $scope.$eval(attrs.props);

          renderComponent(reactComponent, scopeProps, $scope, element, store);
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
            ReactDOM.unmountComponentAtNode(element);
          } else {
            $scope.$eval(attrs.onScopeDestroy)({
              unmountComponent: ReactDOM.unmountComponentAtNode.bind(this, element)
            });
          }
        });
      }
    };
  }
]);

// TODO refactor this function (6 arguments is too much)
function renderComponent(Component, props, scope, elem, store) {
  scope.$evalAsync(() => {
    // this is the single place we mount all our components, so all
    // providers should be added here
    ReactDOM.render(
      <Provider store={store}>
        <Component {...props} scope={scope} />
      </Provider>,
      elem
    );
  });
}

function getReactComponent(name, require, logger) {
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
    reactComponent = requireComponent(name, require);
  } catch (e) {
    logger.logException(e);
  }

  if (!reactComponent) {
    throw Error(`Cannot find react component "${name}"`);
  }

  return reactComponent.default ? reactComponent.default : reactComponent;
}

function requireComponent(name, require) {
  // you can just provide name "@contentful/forma-36-react-components/TextLink"
  if (name.startsWith('@contentful/forma-36-react-components')) {
    const UILibrary = require('@contentful/forma-36-react-components');
    const element = name.split('@contentful/forma-36-react-components/')[1];

    if (!element) {
      throw new Error(
        'You wanted to use forma-36-react-components, but did not provide element:::',
        name
      );
    }

    const ReactElement = UILibrary[element];

    if (!ReactElement) {
      throw new Error(
        `You wanted to use ui-component-libary, but "${element}" does not exist in it`
      );
    }

    return ReactElement;
  } else {
    return require(name);
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
