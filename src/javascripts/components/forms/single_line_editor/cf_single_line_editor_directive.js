'use strict';

angular.module('contentful')
.directive('cfSingleLineEditor', ['$injector', 'cfUiCaretHelper', function ($injector, cfUiCaretHelper) {
  var getPreservedCaretPosition = cfUiCaretHelper.getPreservedCaretPosition;

  return {
    scope: {},
    require: ['^cfWidgetApi'],
    restrict: 'E',
    template: JST['cf_single_line_editor'](),
    link: function (scope, $el, attributes, controllers) {
      var field = controllers[0].field;
      var constraints = _(field.validations).pluck('size').filter().first() || {};
      var $inputEl = $el.children('input');
      var rawInputEl = $inputEl.get(0);

      if (field.type === 'Symbol' && !_.isNumber(constraints.max)) {
        constraints.max = 256;
      }

      scope.constraints = constraints;
      scope.constraintsType = constraintsType(constraints);

      // update input field value when new synced value received via ot magic
      var detachOnValueChangedHandler = field.onValueChanged(updateInputValue, true);
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateIsDisabledFlag, true);

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);

      // run field.validations when data in input field is modified
      // and send updated field value over the wire via sharejs
      $inputEl.on('input change', function () {
        var val = $inputEl.val();

        updateCharCount(val);
        if (val !== field.getValue()) {
          field.setString(val);
        }
      });

      function updateInputValue (newValue) {
        var currentValue = $inputEl.val();

        if (currentValue === newValue) {
          return;
        }

        var newCaretPosition = getPreservedCaretPosition(rawInputEl.selectionStart, currentValue, newValue);

        $inputEl.val(newValue);
        rawInputEl.selectionStart = rawInputEl.selectionEnd = newCaretPosition;
        updateCharCount(newValue);
      }

      function updateCharCount (val) {
        scope.charCount = (val || '').length;
        if (scope.constraints && scope.constraints.max) {
          scope.charCountStatus = getCharCountStatus(scope.charCount, scope.constraints.max);
        }
      }

      function updateIsDisabledFlag (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };

  function getCharCountStatus (len, maxChars) {
    var charsLeft = maxChars - len;

    if (charsLeft < 0) {
      return 'exceeded';
    } else if (charsLeft > -1 && charsLeft < 10) {
      return 'approaching';
    }
  }

  function constraintsType (constraints) {
    if (_.isNumber(constraints.min) && _.isNumber(constraints.max)) {
      return 'min-max';
    } else if (_.isNumber(constraints.min)) {
      return 'min';
    } else if (_.isNumber(constraints.max)) {
      return 'max';
    } else {
      return '';
    }
  }
}]);
