'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name states
 */
.factory('states', ['$injector', function ($injector) {
  var config = $injector.get('states/config');

  return {
    loadAll: loadAll,
    load: load
  };

  /**
   * @ngdoc method
   * @name states#loadAll
   * @description
   * Imports all the root states and and adds them to the router.
   *
   * Needs to be called in a 'run' hook to make the application work
   */
  function loadAll () {
    load([
      $injector.get('states/account'),
      $injector.get('states/spaces'),
      $injector.get('states/home')
    ]);
  }

  /**
   * @ngdoc method
   * @name states#load
   * @description
   * Load only the given states. Used for testing
   *
   * @param {State[]} states
   */
  function load (states) {
    _.forEach(states, config.add);
    config.init();
  }
}])

.config(['$urlMatcherFactoryProvider', function ($urlMatcherFactoryProvider) {
  /*
   * We need to define a dumb type PathSuffix here and use that to
   * represent path suffixes for the Space Settings and Account
   * views, because otherwise UI-Router treats them as regular
   * URL parameters and does nasty things like escaping slashes.
   */
  $urlMatcherFactoryProvider.type('PathSuffix', {
    encode: function (val) { return val !== null ? val.toString() : val; },
    decode: function (val) { return val !== null ? val.toString() : val; },
    is: function (val) { return this.pattern.test(val); },
    pattern: /.*/
  });

  // Avoid being obsessive about matching states to trailing slashes
  $urlMatcherFactoryProvider.strictMode(false);
}])

.factory('states/resolvers', [function () {
  editingInterfaceResolver.$inject = ['spaceContext', 'contentType'];
  function editingInterfaceResolver (spaceContext, contentType) {
    return spaceContext.editingInterfaces.get(contentType.data);
  }

  return {
    editingInterface: editingInterfaceResolver
  };
}]);
