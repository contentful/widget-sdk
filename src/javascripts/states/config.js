import { registerProvider } from 'NgRegistry';
import { difference } from 'lodash';
import * as accessChecker from 'access_control/AccessChecker';

// This is a wrapper for Angular UI Router.
// It takes our internal state definitions and processes
// them so they can be added to the vanilla UI Router.

// These are the props that are valid for our internal
// state definitions. We process and strip some of them
// in this module.
const VALID_DEFINITION_PROPS = [
  'name',
  'url',
  'abstract',
  'navComponent',
  'children',
  'template',
  'resolve',
  'onEnter',
  'params',
  'controller',
  'redirectTo',
  'component',
  'mapInjectedToProps'
];

export default function register() {
  registerProvider('states/config', [
    '$stateProvider',
    $stateProvider => {
      const states = [];

      return {
        $get: [
          () => {
            return {
              add: state => addChildren(null, [state]),
              init: () => states.forEach(s => $stateProvider.state(s))
            };
          }
        ]
      };

      function addChildren(parentName, children) {
        children.forEach(state => {
          const name = parentName ? `${parentName}.${state.name}` : state.name;

          const extraProps = difference(Object.keys(state), VALID_DEFINITION_PROPS);
          if (extraProps.length > 0) {
            throw new Error(`${name} declares extra properties: ${extraProps.join(', ')}`);
          }

          // State definition properties we pass to the UI Router.
          // We should NEVER add more to this list because it ties
          // us more to the UI Router. We should eliminate as many
          // as possible!
          states.push({
            // Vanilla UI Router props:
            name,
            views: composeViews(state, name),
            url: state.url,
            abstract: state.abstract,
            resolve: state.resolve,
            onEnter: state.onEnter,
            // Our own props (they have no meaning to UI Router):
            params: state.params,
            redirectTo: state.redirectTo
          });

          if (state.children) {
            addChildren(name, state.children);
          }
        });
      }

      function composeViews(state, stateName) {
        const views = {};

        if (state.navComponent) {
          views['nav-bar@'] = {
            template: '<react-component component="component" props="props" style="width: 100%" />',
            controller: makeReactNavigationController(state.navComponent)
          };
        }

        if (state.component) {
          views['content@'] = {
            template: '<react-component component="component" props="props" />',
            controller: makeReactController(state, state.component)
          };
        }

        if (!['string', 'undefined'].includes(typeof state.template)) {
          throw new Error(`${stateName}: template should be string or undefined`);
        }

        if (state.template || state.controller) {
          if (views['content@']) {
            throw new Error(`${stateName}: cannot mix React and Angular state definitions`);
          }

          views['content@'] = {
            template: state.template,
            controller: provideScopeContext(state.controller, stateName)
          };
        }

        return views;
      }

      function makeReactNavigationController(component) {
        return [
          '$scope',
          '$stateParams',
          '$rootScope',
          function($scope, $stateParams, $rootScope) {
            $scope.component = component;

            // force nav component rerender on every navigation change
            const unsubscribe = $rootScope.$on('$stateChangeSuccess', () => {
              $scope.props.navVersion = $scope.props.navVersion + 1;
            });

            // temporary fix to rerender when this changes
            // todo: change this once if sure that all accessChecker data is avalable at the time of initial render (suevalov)
            $scope.$watch(
              () => accessChecker.can('manage', 'Environments'),
              () => {
                $scope.props.navVersion = $scope.props.navVersion + 1;
              }
            );

            $scope.props = {
              navVersion: 0,
              stateParams: $stateParams
            };

            $scope.$on('$destroy', () => {
              if (typeof unsubscribe === 'function') {
                unsubscribe();
              }
            });

            $scope.$applyAsync();
          }
        ];
      }

      function makeReactController(state, component) {
        const mapping = state.mapInjectedToProps || [() => ({})];
        const injectables = mapping.slice(0, mapping.length - 1);
        const mapperFn = mapping[mapping.length - 1];

        return ['$scope', '$state'].concat(injectables).concat([
          function($scope, $state) {
            const args = Array.prototype.slice.call(arguments).slice(2);
            $scope.context = {};
            $state.current.data = $scope.context;
            $scope.component = component;
            $scope.props = mapperFn(...args);
            $scope.$applyAsync();
          }
        ]);
      }

      function provideScopeContext(controller, stateName) {
        if (!controller) {
          controller = [() => {}];
        }

        if (typeof controller === 'function') {
          controller = [controller];
        }

        if (!Array.isArray(controller)) {
          throw new Error(`${stateName} controller must to be one of: undefined, function, array`);
        }

        const injectables = controller.slice(0, controller.length - 1);
        const controllerFn = controller[controller.length - 1];

        return ['$scope', '$state'].concat(injectables).concat([
          function($scope, $state) {
            const args = Array.prototype.slice.call(arguments).slice(2);
            $scope.context = {};
            $state.current.data = $scope.context;
            return controllerFn.apply(this, args);
          }
        ]);
      }
    }
  ]);
}
