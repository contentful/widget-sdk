'use strict';

angular.module('contentful')

.value('widgets/deprecations/data', {
  youtubeEditor: {
    alternative: 'URL',
    preview: true
  },
  dropdown: {
    alternative: 'Radio',
    field: ['Boolean']
  }
})


/**
 * @ngdoc service
 * @name widgets/deprecations
 */
.factory('widgets/deprecations', ['$injector', function ($injector) {
  var DEPRECATIONS = $injector.get('widgets/deprecations/data');

  return {
    createFilter: createFilter,
  };


  /**
   * @ngdoc method
   * @name widget/deprecations#createFilter
   * @description
   * Create a filter function that removes deprecated widgets or adds
   * deprecation information
   *
   * @param {string} skipId
   * @param {API.ContentType.field} field
   * @param {boolean} previe
   * @returns {(Widget[]) => Widget[]}
   */
  function createFilter (skipId, field, preview) {
    return function (widgets) {
      return _.filter(widgets, function (widget) {
        var deprecation = DEPRECATIONS[widget.id];
        if (!deprecation) {
          return true;
        }

        if (deprecation.field && !_.contains(deprecation.field, field.type)) {
          return true;
        }

        widget.deprecation = deprecation;

        if (widget.id === skipId) {
          return true;
        }

        if (deprecation.preview && preview) {
          return true;
        }

        return false;
      });
    };
  }

}]);
