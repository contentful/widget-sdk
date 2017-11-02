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

  // Collection of registered services
  var states = [];

  // The actual service
  var stateConfig = {
    add: add,
    init: init
  };

  return {
    $get: function () { return stateConfig; }
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
      state = useContentView(state);
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
    var picked = _.pick(state, VIEW_PROPERTIES);

    if (state.views['content@'] || Object.keys(picked).length < 1) {
      return state;
    } else {
      state.views['content@'] = picked;
      return _.omit(state, VIEW_PROPERTIES);
    }
  }
}]);
