'use strict';

angular.module('cf.ui')
/**
 * @ngdoc service
 * @name ui/caretHelper
 * @description
 * Provides helpers for caret manipulation of text fields
 */
.factory('ui/caretHelper', [function () {
  return {
    getPreservedCaretPosition: getPreservedCaretPosition,
    makeInputUpdater: makeInputUpdater
  };

  /**
   * @ngdoc method
   * @name ui/caretHelper#getPreservedCaretPosition
   * @description
   * Preserve caret position for more natural editing
   *
   * This only works if the string has been modified with a single
   * insert or delete at some position.
   *
   * @param {integer} caretPosition
   * @param {string} oldValue
   * @param {string} newValue
   * @return {integer} reconciled caret position
   */
  function getPreservedCaretPosition (caretPosition, oldValue, newValue) {
    var equalUpTo = getCommonPrefixLength(oldValue, newValue);
    if (equalUpTo <= caretPosition) {
      // Insert or delete before the cursor
      var diffLength = newValue.length - oldValue.length;
      return Math.max(caretPosition + diffLength, 0);
    } else {
      // Insert or delete after the cursor. Nothing to do
      return caretPosition;
    }
  }

  /**
   * @ngdoc method
   * @name ui/caretHelper#makeInputUpdater
   * @description
   * Returns a function that can update an text input field
   * while preserving the caret position
   *
   * @param {jQuery element} $inputEl
   * @return {function}
   */
  function makeInputUpdater ($inputEl) {
    var rawInputEl = $inputEl.get(0);

    return function (value) {
      var currentValue = $inputEl.val();

      if (currentValue !== value) {
        var newCaretPosition = getPreservedCaretPosition(rawInputEl.selectionStart, currentValue, value);

        $inputEl.val(value);
        rawInputEl.selectionStart = rawInputEl.selectionEnd = newCaretPosition;
      }
    };
  }

  function getCommonPrefixLength (a, b) {
    if (a === b) {
      return a.length;
    }

    if (!a || !b) {
      return 0;
    }

    var length = 0;
    while (a.charAt(length) === b.charAt(length)) {
      length++;
    }
    return length;
  }
}]);
