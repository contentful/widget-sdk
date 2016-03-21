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
   * @param {integer} currentCaretPosition
   * @param {string} currentValue
   * @param {string} newValue
   * @return {integer} reconciled caret position
   */
  function getPreservedCaretPosition (currentCaretPosition, currentValue, newValue) {
    currentValue = currentValue || '';
    // sharejs sets newValue to `null` when it's "empty" or when validations fail
    newValue = newValue || '';

    if (currentValue === newValue) {
      return currentCaretPosition;
    }

    /**
     * The basic idea is as follows:
     *
     * Find the first index at which the characters in two strings diverge (commonStart)
     * If commonStart > current caret position, retain current caret position
     * If commonStart <= current caret position
     *   Get numbers of chars modified (abs(currentValue.length - newValue.length))
     *   If operation was delete, move caret back by "chars modified" places
     *   If operation was append, move caret forward by "chars modified" places
     */
    var commonStart = 0;
    var caretPosition = parseInt(currentCaretPosition, 10) || 0;
    var noOfCharsModified = newValue.length - currentValue.length;

    if (!newValue) {
      caretPosition = 0;
    }
    else {
      while(currentValue.charAt(commonStart) === newValue.charAt(commonStart)) {
        commonStart++;
      }
      if (commonStart <= caretPosition) {
        caretPosition += noOfCharsModified;
      }
    }

    return caretPosition < 0 ? 0 : caretPosition;
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
}]);
