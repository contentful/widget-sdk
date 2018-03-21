'use strict';

angular.module('contentful')
.directive('cfNumberEditor', ['require', function (require) {
  var parseNumber = require('cfNumberEditor/parseNumber');
  var InputUpdater = require('ui/inputUpdater');
  var debounce = require('debounce');

  return {
    scope: {},
    restrict: 'E',
    require: '^cfWidgetApi',
    template: JST['cf_number_editor'](),
    link: function (scope, $el, _attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.find('input');
      var updateInput = InputUpdater.create($inputEl.get(0));

      // update input field value when new synced value received via ot magic
      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        updateInput(val === 0 ? String(val) : (val ? String(val) : ''));
      });
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onIsDisabledChanged(updateDisabledStatus);

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        scope.hasErrors = errors && errors.length > 0;
      });

      var range = getRangeFromField(field);

      scope.min = range.min;
      scope.max = range.max;
      scope.step = field.type === 'Integer' ? 1 : 'any';

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);
      scope.$on('$destroy', offSchemaErrorsChanged);

      scope.$watch(function () {
        return $inputEl.val();
      }, function (val) {
        var parseResult = parseNumber(val, field.type);

        scope.parseWarning = parseResult.warning;
        field.setInvalid(!parseResult.isValid);
        if (parseResult.isValid) {
          field.setValue(parseResult.value);
        }
      });

      // Since all input handling is done in scope.$watch
      // this is to run the watcher when user interacts
      // with the text input
      $inputEl.on('input change', debounce(function () {
        scope.$apply();
      }, 200));

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };

  function getRangeFromField (field) {
    var validation = _.find(field.validations, function (validation) {
      return validation.range;
    });
    return _.get(validation, 'range', {});
  }
}])
/**
 * @ngdoc service
 * @name cfNumberEditor/parseNumber
 */
.factory('cfNumberEditor/parseNumber', [function () {
  /**
   * @ngdoc method
   * @name cfNumberEditor/parseNumber#
   * @description
   * Tries to parse given string as number
   *
   * @param {string} viewValue  String to be parsed
   * @param {string} type       Type to parse given string as
   * @return {object}
   */
  return function (value, type) {
    // This has saner semantics than parseFloat.
    // For values with chars in 'em, it gives
    // us NaN unlike parseFloat
    var floatVal = +value;
    var hasDot = (/\./g).test(value);
    var hasFractional = (/\.\d+/g).test(value);

    if (_.isEmpty(value)) {
      return {
        isValid: true,
        warning: '',
        value: undefined
      };
    }

    if (isNaN(floatVal)) {
      return {
        isValid: false,
        warning: 'Unrecognized Number',
        value: value
      };
    }

    if (type === 'Integer' && hasDot) {
      var intVal = parseInt(value, 10);

      return {
        isValid: false,
        warning: 'Recognized value: ' + intVal,
        value: intVal
      };
    }

    if (hasDot && !hasFractional) {
      return {
        isValid: false,
        warning: 'Recognized value: ' + floatVal,
        value: floatVal
      };
    }

    return {
      isValid: true,
      warning: '',
      value: floatVal
    };
  };
}]);
