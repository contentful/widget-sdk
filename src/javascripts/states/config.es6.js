import { registerProvider } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  /**
   * @ngdoc service
   * @name states/config
   * @description
   * Add states to the application and initialize them.
   *
   * This is a proxy for the 'ui.router' module. The service is only used
   * by the root [`states` service][service:states]
   *
   * [service:states]: api/contentful/app/service/states
   */
  registerProvider('states/config', [
    '$stateProvider',
    $stateProvider => {
      // Collection of registered services
      const states = [];

      // The actual service
      const stateConfig = {
        add: add,
        init: init
      };

      return {
        $get: [() => stateConfig]
      };

      /*
       * @ngdoc method
       * @name states/config#init
       * @description
       * Load all registered states into `ui.router.$stateProvider`.
       */
      function init() {
        _.forEach(states, s => {
          $stateProvider.state(s);
        });
      }

      /**
       * @ngdoc method
       * @name states/config#init
       * @description
       * Register a top-level state. Recursively adds states in the
       * `children` property.
       *
       * @param {object} state
       */
      function add(state) {
        addChildren(null, [state]);
      }

      function addChildren(parentName, children) {
        children.forEach(state => {
          state = useContentView(state);

          const children = state.children;
          let name;
          if (parentName) {
            name = parentName + '.' + state.name;
          } else {
            name = state.name;
          }

          _.forEach(state.views, view => {
            if (!['string', 'undefined'].includes(typeof view.template)) {
              throw new Error(`${name}: template should be string or undefined`);
            }

            provideScopeContext(view);
          });

          state = _.omit(state, ['children']);
          state.name = name;
          states.push(state);
          if (children) {
            addChildren(name, children);
          }
        });
      }

      function useContentView(state) {
        const VIEW_PROPERTIES = ['controller', 'controllerAs', 'template'];
        state.views = state.views || {};
        const contentView = _.pick(state, VIEW_PROPERTIES);
        if (contentView.template || contentView.controller) {
          state.views['content@'] = contentView;
          return _.omit(state, VIEW_PROPERTIES);
        } else {
          return state;
        }
      }

      function provideScopeContext(view) {
        if (!view.controller) {
          view.controller = [() => {}];
        }

        if (typeof view.controller === 'function') {
          view.controller = [view.controller];
        }

        if (!Array.isArray(view.controller)) {
          throw new Error('controller must to be one of: undefined, function, array.');
        }

        const injectables = view.controller.slice(0, view.controller.length - 1);
        const controllerFn = view.controller[view.controller.length - 1];

        view.controller = ['$scope', '$state'].concat(injectables).concat([
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
