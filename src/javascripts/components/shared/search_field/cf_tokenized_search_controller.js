'use strict';

/**
 * Controller for the tokenized search
 *
 * The interaction with the tokenized search happens mainly in three ways:
 * - keyboard input, focusing, blurring is triggered from the template
 * - when the input changes, we parse the searchterm ($scope.inner.term)
 * - depending on the parse tree and the current position of the cursor we display autocompletions.
 * - certain keypresses are redirected to the autocompletions instead of editing the text input
 */
angular.module('contentful')
.controller('cfTokenizedSearchController', ['$scope', 'require', '$attrs', function ($scope, require, $attrs) {

  var searchQueryHelper = require('searchQueryHelper');
  var keycodes = require('keycodes');
  var $parse = require('$parse');

  $scope.inner = { term: null };
  $scope.position = 0;
  $scope.showAutocompletions = false; // Indicate if completions should be shown

  $scope.getContentType = function () {
    return $scope.$eval($attrs.searchContentType);
  };

  // The parse token that the cursor is currently on
  $scope.getCurrentToken = function () {
    return searchQueryHelper.currentSubToken($scope.getContentType(), $scope.inner.term, $scope.position);
  };

  // Update the available autocompletions
  //
  // scope.autocompletion contains the current autocompletion object,
  // as generated by the searchQueryAutocompletions service
  $scope.updateAutocompletions = function () {
    var contentType = $scope.getContentType();
    var space = $scope.spaceContext.space;
    var term = $scope.inner.term;
    var position = $scope.position;

    searchQueryHelper.offerCompletion(space, contentType, term, position)
    .then(function (completion) {
      $scope.autocompletion = completion;
      $scope.$broadcast('autocompletionsUpdated', completion);
    });
  };

  // Get out of autocompleting
  $scope.clearAutocompletions = function () {
    $scope.restoreString();
    $scope.showAutocompletions = false;
  };

  $scope.$watch('getContentType()', _.bind($scope.updateAutocompletions, $scope));

  $scope.inputChanged = function () {
    // TODO: This is necessary because $scope.position will only be updated in the next digtest cycle.
    // When deleting from the end, this can cause the position to be $scope.inner.term.length + 1
    // which gives a current token of undefined
    $scope.position = $scope.getPosition();
    $scope.updateAutocompletions();
  };

  $scope.keyReleased = function (event) {

    if ($scope.position !== $scope.getPosition()) {
      $scope.position = $scope.getPosition();
      $scope.updateAutocompletions();
    }

    if (event.keyCode !== keycodes.DOWN &&
        event.keyCode !== keycodes.UP &&
        event.keyCode !== keycodes.LEFT &&
        event.keyCode !== keycodes.RIGHT &&
        event.keyCode !== keycodes.ESC &&
        !$scope.showAutocompletions) {
      submitSearch();
    }
  };

  // We communicate keypresses as events downwards so that different autocompletion widgets can handle them as they see fit
  $scope.keyPressed = function (event) {
    if (event.keyCode === keycodes.DOWN) {
      $scope.showAutocompletions = true;
      if ($scope.autocompletion && $scope.showAutocompletions) {
        $scope.$broadcast('selectNextAutocompletion');
        event.preventDefault();
      }
    } else if (event.keyCode === keycodes.UP) {
      $scope.showAutocompletions = true;
      if ($scope.autocompletion && $scope.showAutocompletions) {
        $scope.$broadcast('selectPreviousAutocompletion');
        event.preventDefault();
      }
    } else if (event.keyCode === keycodes.ESC) {
      if ($scope.autocompletion && $scope.showAutocompletions) {
        $scope.$broadcast('cancelAutocompletion');
        $scope.clearAutocompletions();
        event.preventDefault();
      }
    } else if (event.keyCode === keycodes.ENTER) {
      if ($scope.autocompletion && $scope.showAutocompletions) {
        var e = $scope.$broadcast('submitAutocompletion');
        if (e.defaultPrevented) {
          submitSearch();
          $scope.showAutocompletions = false;
          forceSearch();
        } else {
          $scope.confirmAutocompletion();
        }
      } else {
        submitSearch();
        forceSearch();
      }
      event.preventDefault();
    }
  };

  $scope.updateFromButton = function () {
    submitSearch();
    forceSearch();
  };

  $scope.currentTokenContent = function () {
    var token = $scope.getCurrentToken();
    return token && token.content;
  };

  function forceSearch () {
    $scope.$emit('forceSearch');
  }

  // FORMER LINK FUNCTION STUFF;

  var getSearchTerm = $parse($attrs.cfTokenizedSearch);
  var setSearchTerm = getSearchTerm.assign;

  $scope.$watch(function (scope) {
    return getSearchTerm(scope.$parent);
  }, function (term) {
    $scope.inner.term = term;
  });

  $attrs.$observe('placeholder', function (placeholder) {
    $scope.placeholder = placeholder;
  });

  function submitSearch () {
    setSearchTerm($scope.$parent, $scope.inner.term);
  }

  $scope.hasFocus = false;

  $scope.inputFocused = function () {
    $scope.hasFocus = true;
    $scope.updateAutocompletions();
  };

  $scope.inputBlurred = function () {
    $scope.hasFocus = false;
  };

  // Handle if the focus moves out of the tokenizedSearch subtree
  $scope.leftSearch = function (event) {
    // If we clicked on a button in the datepicker the leftSearch will trigger although it
    // shouldn't because the DOM node has been removed and the parent lookup won't work correctly
    // http://stackoverflow.com/questions/22406505
    if ($(event.target).parents('[data-event=click]').length > 0) return;
    $scope.clearAutocompletions();
  };

  // Replace the currently selected (touched by the cursor counts as selection)
  // token with the insertString. Backs up the current search string before
  // and selects the replacement afterwards
  $scope.fillAutocompletion = function (insertString) {
    var token = $scope.getCurrentToken();
    var originalString = $scope.inner.term || '';
    if (!token) {
      token = {
        offset: $scope.position || 0,
        length: 0
      };
    }
    if (token.type !== 'Value') insertString = insertString + ' ';
    $scope.backupString(originalString, token.offset, token.length);
    $scope.inner.term = spliceSlice(originalString, token.offset, token.length, insertString);
    $scope.selectRange(token.offset, insertString.length);
  };

  // Confirms the currently selected autocompletion.
  //
  // The currently selected autocompletion is the selected substring
  // (corresponding to the current token) in the input field. This
  // Token is extended, depending on its type (with an operator or a space)
  // the backupString is cleared and the cursor is placed at the end of the token
  $scope.confirmAutocompletion = function () {
    var token = $scope.getCurrentToken();
    if (!token) {
      return;
    }
    var originalString = $scope.inner.term || '';
    var appendString = token.type === 'Value' ? ' ' : token.type === 'Operator' ? '' : operator(token.content) + ' ';
    $scope.inner.term = spliceSlice(originalString, token.end, 0, appendString);
    $scope.clearBackupString();
    if (token.type === 'Value') {
      submitSearch();
      $scope.showAutocompletions = false;
    }
    $scope.selectRange(token.end + appendString.length, 0)
    .then(function () {
      if ($scope) {
        $scope.position = token.end + appendString.length;
        $scope.updateAutocompletions();
      }
    });

    function operator (key) {
      return searchQueryHelper.operatorForKey(key, $scope.getContentType());
    }
  };

  $scope._backupString = null;
  $scope.backupString = function (str, offset, length) {
    var b = str.slice(offset, offset + length);
    if (!$scope._backupString && b.length > 0) {
      $scope._backupString = b;
    }
  };

  $scope.restoreString = function () {
    var token = $scope.getCurrentToken();
    if (token && $scope._backupString) {
      $scope.inner.term = spliceSlice($scope.inner.term, token.offset, token.length, $scope._backupString);
      $scope._backupString = null;
    }
  };

  $scope.clearBackupString = function () {
    $scope._backupString = null;
  };

  // The splice function from arrays implemented for strings using
  // String.prototype.slice
  //
  // str: the original string
  // index: position where to insert
  // count: how many characters to remove at index
  // add: which string to insert at the index
  function spliceSlice (str, index, count, add) {
    return str.slice(0, index) + add + str.slice(index + count);
  }

  $scope.$on('$destroy', function () {
    $scope = null; // MEMLEAK FIX
  });

}]);
