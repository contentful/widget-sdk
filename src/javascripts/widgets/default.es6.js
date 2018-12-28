import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import widgetMap from '@contentful/widget-map';
/**
 * @ngdoc service
 * @name widgets/default
 */
registerFactory('widgets/default', [
  'fieldFactory',
  fieldFactory => {
    // We can use a dropdown widget for these field types
    const DROPDOWN_TYPES = ['Text', 'Symbol', 'Integer', 'Number', 'Boolean'];

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
    return function getDefaultWidgetId(field, displayFieldId) {
      const fieldType = fieldFactory.getTypeName(field);

      // FIXME We create the editing interface, and thus the widget ids
      // before any validation can be set. So I think this is not need.
      const shouldUseDropdown = hasInValidation(field.validations);
      const canUseDropdown = _.includes(DROPDOWN_TYPES, fieldType);

      if (shouldUseDropdown && canUseDropdown) {
        return 'dropdown';
      }

      const isTextField = fieldType === 'Text';
      const isDisplayField = field.id === displayFieldId;

      if (isTextField && isDisplayField) {
        return 'singleLine';
      }

      return widgetMap.DEFAULTS[fieldType];
    };

    function hasInValidation(validations) {
      return _.find(validations, validation => 'in' in validation);
    }
  }
]);
