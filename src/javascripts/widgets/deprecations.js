'use strict';

angular.module('contentful')

.value('widgets/deprecations/data', {
  // Format looks like this
  //
  // dropdown: {
  //   alternative: 'Radio',
  //   field: ['Boolean']
  // }
})


/**
 * @ngdoc service
 * @name widgets/deprecations
 */
.factory('widgets/deprecations', ['require', function (require) {
  var DEPRECATIONS = require('widgets/deprecations/data');

  return {
    createFilter: createFilter,
  };


  /**
   * @ngdoc method
   * @name widgets/deprecations#createFilter
   * @description
   * Create a filter function that removes deprecated widgets or adds
   * deprecation information
   *
   * @param {string} skipId
   * @param {API.ContentType.field} field
   * @returns {(Widget[]) => Widget[]}
   */
  function createFilter (skipId, field) {
    return function (widgets) {
      return _.filter(widgets, function (widget) {
        var deprecation = DEPRECATIONS[widget.id];
        if (!deprecation) {
          return true;
        }

        if (deprecation.field && !_.includes(deprecation.field, field.type)) {
          return true;
        }

        widget.deprecation = deprecation;

        if (widget.id === skipId) {
          return true;
        }

        return false;
      });
    };
  }

}]);
