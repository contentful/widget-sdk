'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name states/config
 * @description
 * Add states to the application and initialize them.
 *
 * This is aproxy for the 'ui.router' module. The service is only used
 * by the root [`states` service][service:states]
 *
 * [service:states]: api/contentful/app/service/states
 */
.provider('states/config', ['$stateProvider', function ($stateProvider) {
  var VIEW_PROPERTIES = ['controller', 'controllerAs', 'template', 'templateProvider'];

  // Is assigned the `h` export from the `ui/Framework` module.
  // This is necessary because we define a provider and not a factory.
  var renderString;

  // Collection of registered services
  var states = [];

  // The actual service
  var stateConfig = {
    add: add,
    init: init
  };

  return {
    $get: ['require', function (require) {
      renderString = require('ui/Framework').renderString;

      return stateConfig;
    }]
  };

  /*
   * @ngdoc method
   * @name states/config#init
   * @description
   * Load all registered states into `ui.router.$stateProvider`.
   */
  function init () {
    _.forEach(states, function (s) {
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
  function add (state) {
    addChildren(null, [state]);
  }

  function addChildren (parentName, children) {
    children.forEach(function (state) {
      state = provideScopeContext(state);
      state = useContentView(state);

      if (state.views) {
        _.forEach(state.views, function (view) {
          view.template = templateToString(view.template);
        });
      }

      var children = state.children;
      var name;
      if (parentName) {
        name = parentName + '.' + state.name;
      } else {
        name = state.name;
      }

      state = _.omit(state, ['children']);
      state.name = name;
      states.push(state);
      if (children) {
        addChildren(name, children);
      }
    });
  }

  function useContentView (state) {
    state.views = state.views || {};
    var contentView = _.pick(state, VIEW_PROPERTIES);
    if (contentView.template || contentView.templateProvider) {
      state.views['content@'] = contentView;
      return _.omit(state, VIEW_PROPERTIES);
    } else {
      return state;
    }
  }

  function provideScopeContext (state) {
    if (!state.controller) {
      state.controller = [function () {}];
    }

    if (typeof state.controller === 'function') {
      state.controller = [state.controller];
    }

    if (!Array.isArray(state.controller)) {
      throw new Error('controller must to be one of: undefined, function, array.');
    }

    var injectables = state.controller.slice(0, state.controller.length - 1);
    var controllerFn = state.controller[state.controller.length - 1];

    state.controller = ['$scope', '$state']
      .concat(injectables)
      .concat([function ($scope, $state) {
        var args = Array.prototype.slice.call(arguments).slice(2);
        $state.current.data = $state.current.data || {};
        Object.defineProperty($scope, 'context', {
          configurable: false,
          enumerable: true,
          writable: false,
          value: $state.current.data
        });
        return controllerFn.apply(this, args);
      }]);

    return state;
  }

  function templateToString (template) {
    if (!template || typeof template === 'string') {
      return template;
    } else if (Array.isArray(template)) {
      return template.map(renderString).join('');
    } else {
      return renderString(template);
    }
  }
}]);
