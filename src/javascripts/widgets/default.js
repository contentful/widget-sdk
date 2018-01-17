'use strict';


/**
 * @ngdoc service
 * @name widgets/default
 */
angular.module('contentful')
.factory('widgets/default', ['require', function (require) {
  var fieldFactory = require('fieldFactory');
  var widgetMap = require('widgetMap');

  // We can use a dropdown widget for these field types
  var DROPDOWN_TYPES = ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'];

  /**
   * @ngdoc method
   * @name widgets/default#
   * @param {API.ContentType.Field} field
   * @param {string} displayFieldId
   * @return {string}
   *
   * @description
   * Get the default widget ID for a field
   *
   * It accounts for legacy behavior for when there were no user selectable
   * widgets for a given field and some fields would have different widgets
   * in different occasions, specifically:
   * - Text field: defaults to markdown, unless it is a title field.
   *   where it gets switched to singleLine
   * - Any field that allows for predefined values: gets changed to a dropdown
   *   in the presence of the 'in' validation
   */
  return function getDefaultWidgetId (field, displayFieldId) {
    var fieldType = fieldFactory.getTypeName(field);

    // FIXME We create the editing interface, and thus the widget ids
    // before any validation can be set. So I think this is not need.
    var shouldUseDropdown = hasInValidation(field.validations);
    var canUseDropdown = _.includes(DROPDOWN_TYPES, fieldType);

    if (shouldUseDropdown && canUseDropdown) {
      return 'dropdown';
    }

    var isTextField = fieldType === 'Text';
    var isDisplayField = field.id === displayFieldId;

    if (isTextField && isDisplayField) {
      return 'singleLine';
    }

    return widgetMap.DEFAULTS[fieldType];
  };

  function hasInValidation (validations) {
    return _.find(validations, function (validation) {
      return 'in' in validation;
    });
  }
}]);
