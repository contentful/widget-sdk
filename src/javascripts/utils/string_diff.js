'use strict';

angular.module('cf.utils').factory('utils/StringDiff', [
  () => {
    return {
      diff: diff
    };

    function diff(a, b) {
      if (a === b) {
        return [];
      }

      var commonStart = 0;
      var commonEnd = 0;

      // Determine the size of the common prefix.
      while (a.charAt(commonStart) === b.charAt(commonStart)) {
        commonStart += 1;
      }

      // Determine the size of the common suffix.
      // We break before we overlap with the common prefix
      while (
        charFromEnd(a, commonEnd) === charFromEnd(b, commonEnd) &&
        commonStart + commonEnd < a.length &&
        commonStart + commonEnd < b.length
      ) {
        commonEnd += 1;
      }

      var ops = [];

      var deletedChars = a.length - commonStart - commonEnd;
      if (deletedChars > 0) {
        ops.push({ delete: [commonStart, deletedChars] });
      }
      var insertedChars = b.length - commonStart - commonEnd;
      if (insertedChars > 0) {
        ops.push({ insert: [commonStart, b.slice(commonStart, b.length - commonEnd)] });
      }

      return ops;
    }

    function charFromEnd(str, i) {
      return str.charAt(str.length - 1 - i);
    }
  }
]);
