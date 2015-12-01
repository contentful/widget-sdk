'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name widgets/store
 * @description
 * Store custom and builtin widget implementations for the current
 * space.
 *
 * This service caches the widgets of the given space.
 */
.factory('widgets/store', ['$injector', function ($injector) {
  var $q = $injector.get('$q');
  var builtinWidgets = $injector.get('widgets/builtin');

  var space;
  var widgetCache;

  return {
    setSpace: setSpace,
    getMap: getMap,
  };

  /**
   * @ngdoc method
   * @name widgets/store#set
   * @param {Client.Space} space
   */
  function setSpace (_space) {
    space = _space;
    widgetCache = null;
  }


  /**
   * @ngdoc method
   * @name widgets/store#getMap
   * @description
   * Returns an object that maps widget ids to widget descriptions.
   *
   * @returns {Map<string, Widget.Descriptor>}
   */
  function getMap () {
    if (!space) {
      return $q.reject(new Error('Space is not set'));
    }

    if (!widgetCache) {
      widgetCache = customWidgets()
      .then(function (widgets) {
        return _.extend({}, builtinWidgets, widgets);
      });
    }

    return widgetCache;
  }

  function customWidgets (/* space */) {
    return $q.resolve({});
  }
}]);
