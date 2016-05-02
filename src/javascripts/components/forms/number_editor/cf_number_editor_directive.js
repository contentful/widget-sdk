'use strict';

angular.module('contentful')
.directive('cfNumberEditor', ['$injector', function ($injector) {
  var makeInputUpdater = $injector.get('ui/caretHelper').makeInputUpdater;
  var parseNumber = $injector.get('cfNumberEditor/parseNumber');
  var debounce = $injector.get('debounce');

  return {
    scope: {},
    restrict: 'E',
    require: '^cfWidgetApi',
    template: JST['cf_number_editor'](),
    link: function (scope, $el, attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.find('input');
      var updateInput = makeInputUpdater($inputEl);

      // update input field value when new synced value received via ot magic
      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        updateInput(val === 0 ? String(val) : (val ? String(val) : ''));
      });
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateDisabledStatus);

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);

      scope.$watch(function () {
        return $inputEl.val();
      }, function (val) {
        var parseResult = parseNumber(val.trim(), field.type);

        scope.parseWarning = parseResult.warning;
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
}])
.factory('cfNumberEditor/parseNumber', [function () {
  /**
   * @ngdoc method
   * @name cfNumberEditor#parseNumber
   * @description
   * Tries to parse given string as number
   *
   * @param {string} viewValue  String to be parsed
   * @param {string} type       Type to parse given string as
   * @return {object}
   */
  return function (viewValue, type) {
    // This has saner semantics than parseFloat.
    // For values with chars in 'em, it gives
    // us NaN unlike parseFloat
    var floatVal = +viewValue;
    var hasDot = (/\./g).test(viewValue);
    var hasFractional = (/\.\d+/g).test(viewValue);

    if (_.isEmpty(viewValue)) {
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
        value: viewValue
      };
    }

    if (type === 'Integer' && hasDot) {
      var intVal = parseInt(viewValue, 10);

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
