'use strict';

angular.module('contentful').directive('cfSingleLineEditor', function () {
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

        // sharejs sets newValue to `null` when it's "empty"
        // This makes sure newValue.length doesn't blow up
        newValue = newValue || '';

        var commonStart = 0;
        var caretPosition = rawInputEl.selectionStart;
        var noOfCharsModified = newValue.length - currentValue.length;

        /**
         * If newValue.length - currentValue.length is -ve, chars were deleted and vice-versa.
         * Find the first index at which the characters in two strings diverge (commonStart)
         * If commonStart >= current caret position, preserve current caret position
         * If commonStart < current caret position
         *   Get numbers of chars modified (abs(currentValue.length - newValue.length))
         *   If operation was delete, move caret back by "chars modified" places
         *   If operation was append, move caret forward by "chars modified" places
         */
        if (!newValue) {
          caretPosition = 0;
        } else {
          while(currentValue.charAt(commonStart) === newValue.charAt(commonStart)) {
            commonStart++;
          }
          if (commonStart <= caretPosition) {
            caretPosition += noOfCharsModified;
          }
        }

        $inputEl.val(newValue);
        rawInputEl.selectionStart = rawInputEl.selectionEnd = caretPosition;
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
});
