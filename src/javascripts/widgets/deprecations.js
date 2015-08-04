'use strict';

/**
 * @ngdoc service
 * @name widgets/deprecations
 */
angular.module('contentful')
.factory('widgets/deprecations', [function () {

  var DEPRECATIONS = {
    youtubeEditor: {
      alternative: 'Embedded Content',
      preview: true
    },
    dropdown: {
      alternative: 'Radio',
      field: ['Boolean']
    }
  };

  return {
    createFilter: createFilter,
    deprecate: deprecate
  };


  function deprecate (widgetId, deprecation) {
    DEPRECATIONS[widgetId] = deprecation;
  }


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

        widget.deprecation = deprecation;

        if (widget.id === skipId) {
          return true;
        }

        if (deprecation.preview && !preview) {
          return false;
        }

        if (deprecation.field && _.contains(deprecation.field, field.type)) {
          return false;
        }

        return true;
      });
    };
  }

}]);
