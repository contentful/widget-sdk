'use strict';

angular.module('contentful')
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
.provider('states/config', ['$stateProvider', $stateProvider => {
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
    $get: ['require', require => {
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
  function add (state) {
    addChildren(null, [state]);
  }

  function addChildren (parentName, children) {
    children.forEach(state => {
      state = useContentView(state);

      _.forEach(state.views, view => {
        provideScopeContext(view);
        view.template = templateToString(view.template);
      });

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
    var VIEW_PROPERTIES = ['controller', 'controllerAs', 'template'];
    state.views = state.views || {};
    var contentView = _.pick(state, VIEW_PROPERTIES);
    if (contentView.template || contentView.controller) {
      state.views['content@'] = contentView;
      return _.omit(state, VIEW_PROPERTIES);
    } else {
      return state;
    }
  }

  function provideScopeContext (view) {
    if (!view.controller) {
      view.controller = [() => {}];
    }

    if (typeof view.controller === 'function') {
      view.controller = [view.controller];
    }

    if (!Array.isArray(view.controller)) {
      throw new Error('controller must to be one of: undefined, function, array.');
    }

    var injectables = view.controller.slice(0, view.controller.length - 1);
    var controllerFn = view.controller[view.controller.length - 1];

    view.controller = ['$scope', '$state']
      .concat(injectables)
      .concat([function ($scope, $state) {
        var args = Array.prototype.slice.call(arguments).slice(2);
        $scope.context = {};
        $state.current.data = $scope.context;
        return controllerFn.apply(this, args);
      }]);
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
