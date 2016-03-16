'use strict';

angular.module('cf.ui')
/**
 * @ngdoc service
 * @name cfUiCaretHelper
 * @description
 * Provides helpers for caret manipulation of text fields
 */
.factory('cfUiCaretHelper', [function () {
  return {
    getPreservedCaretPosition: getPreservedCaretPosition
  };

  /**
   * @ngdoc method
   * @name cfUiCaretHelper#getPreservedCaretPosition
   * @description
   * Preserve caret position for more natural editing
   *
   * @param {integer} currentCaretPosition
   * @param {string} currentValue
   * @param {string} newValue
   * @return {integer} reconciled caret position
   */
  function getPreservedCaretPosition (currentCaretPosition, currentValue, newValue) {
    if (currentValue === newValue) {
      return currentCaretPosition;
    }

    if (isUndefinedOrNull(currentValue)) {
      currentValue = '';
    }

    // sharejs sets newValue to `null` when it's "empty"
    if (isUndefinedOrNull(newValue)) {
      newValue = '';
    }

    // This makes sure newValue`.length doesn't blow up
    newValue = newValue.toString();

    // safe guard against non-string values for currentValue
    currentValue = currentValue.toString();

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

    return caretPosition;
  }

  function isUndefinedOrNull (value) {
    return _.isUndefined(value) || _.isNull(value);
  }
}]);
