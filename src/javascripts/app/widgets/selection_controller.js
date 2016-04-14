'use strict';

angular.module('contentful')
.factory('widgets/selectionController', [function () {

  return {
    create: create,
    createFromValidations: createFromValidations
  };

  function create (widgetApi, scope, options) {
    var field = widgetApi.field;

    scope.required = field.required;
    scope.options = options;

    // We need to store field value in an object so we can mutate it
    // in child scopes.
    scope.data = {};
    scope.fieldId = field.id;

    var removeChangeListener = field.onValueChanged(function (value) {
      scope.data.selected = value;
    });

    var removeDisabledStatusListener = field.onDisabledStatusChanged(function (disabled) {
      scope.isDisabled = disabled;
    });

    scope.$watch('data.selected', function (value) {
      // ngModel uses 'null' when nothing is selected
      if (value === null) {
        value = undefined;
      }
      field.setValue(value);
    });

    scope.$on('destroy', function () {
      removeChangeListener();
      removeDisabledStatusListener();
    });
  }

  function createFromValidations (widgetApi, scope) {
    var options = getOptions(widgetApi.field);
    create(widgetApi, scope, options);
  }

  function parseValue (value, type) {
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

  function getOptions (field) {
    // Get first object that has a 'in' property
    var predefinedValues = _.filter(_.pluck(field.validations, 'in'))[0];
    return _.map(predefinedValues, function (value) {
      return { value: parseValue(value, field.type), label: String(value) };
    });
  }
}]);
