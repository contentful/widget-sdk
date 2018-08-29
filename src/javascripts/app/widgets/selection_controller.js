'use strict';

angular.module('contentful').factory('widgets/selectionController', [
  () => {
    return {
      create: create,
      createFromValidations: createFromValidations
    };

    function create(widgetApi, scope, options) {
      const field = widgetApi.field;

      scope.required = field.required;
      scope.options = options;

      if (options.length === 0) {
        scope.misconfigured = true;
        return;
      }

      // We need to store field value in an object so we can mutate it
      // in child scopes.
      scope.data = {};
      scope.fieldId = field.id;
      scope.isDirected = _.includes(['Text', 'Symbol'], field.type);

      scope.clear = function clear(e) {
        e.preventDefault();
        field.removeValue();
      };

      const removeChangeListener = field.onValueChanged(value => {
        scope.data.selected = value;
      });

      const removeDisabledStatusListener = field.onIsDisabledChanged(disabled => {
        scope.isDisabled = disabled;
      });

      scope.$watch('data.selected', value => {
        // ngModel uses 'null' when nothing is selected
        if (value === null) {
          value = undefined;
        }
        field.setValue(value);
      });

      scope.$on('destroy', () => {
        removeChangeListener();
        removeDisabledStatusListener();
      });
    }

    function createFromValidations(widgetApi, scope) {
      const options = getOptions(widgetApi.field);
      create(widgetApi, scope, options);
    }

    function parseValue(value, type) {
      switch (type) {
        case 'Integer':
          value = parseInt(value, 10);
          return isNaN(value) ? undefined : value;
        case 'Number':
          value = parseFloat(value, 10);
          return isNaN(value) ? undefined : value;
        default:
          return value;
      }
    }

    function getOptions(field) {
      // Get first object that has a 'in' property
      const predefinedValues = _.filter(_.map(field.validations, 'in'))[0];
      return _.map(predefinedValues, value => ({
        value: parseValue(value, field.type),
        label: String(value)
      }));
    }
  }
]);
