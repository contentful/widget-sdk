'use strict';

angular.module('contentful').controller('cfTokenizedSearchController', function ($scope, searchQueryHelper, keycodes, $attrs, $parse) {
  $scope.inner = { term: null };
  $scope.position = null;
  $scope.showAutocompletions = false;

  $scope.getContentType = function () {
    return $scope.$eval($attrs.searchContentType);
  };

  $scope.getCurrentToken = function () {
    return searchQueryHelper.currentSubToken($scope.getContentType(), $scope.inner.term, $scope.position);
  };

  $scope.getCurrentPrefix = function () {
    // TODO SyntaxError: Invalid regular expression: /^\/: \ at end of pattern
    var token = $scope.getCurrentToken();
    if (token) return new RegExp('^'+token.text);
  };

  $scope.updateAutocompletions = function () {
    var contentType = $scope.getContentType(),
        space       = $scope.spaceContext.space,
        term        = $scope.inner.term,
        position    = $scope.position;
    searchQueryHelper.offerCompletion(space, contentType, term, position)
    .then(function (completion) {
      $scope.autocompletion = completion;
      $scope.$broadcast('autocompletionsUpdated', completion);
    });
  };

  $scope.clearAutocompletions = function () {
    $scope.restoreString();
    toggleAutocompletions(false);
  };

  $scope.$watch('getContentType()', 'updateAutocompletions()');

  $scope.inputChanged = function () {
    // TODO: This is necessary because $scope.position will only be updated in the next digtest cycle.
    // When deleting from the end, this can cause the position to be $scope.inner.term.length + 1
    // which gives a current token of undefined
    $scope.position = $scope.getPosition();
    $scope.updateAutocompletions();
    $scope.$emit('tokenizedSearchInputChanged', $scope.inner.term);
  };

  $scope.keyReleased = function () {
    if ($scope.position !== $scope.getPosition()) {
      $scope.position = $scope.getPosition();
      $scope.updateAutocompletions();
    }
  };

  $scope.keyPressed = function (event) {
    if (event.keyCode == keycodes.DOWN){
      toggleAutocompletions(true);
      if ($scope.autocompletion && $scope.showAutocompletions) {
        $scope.$broadcast('selectNextAutocompletion');
        event.preventDefault();
      }
    } else if (event.keyCode == keycodes.UP) {
      toggleAutocompletions(true);
      if ($scope.autocompletion && $scope.showAutocompletions) {
        $scope.$broadcast('selectPreviousAutocompletion');
        event.preventDefault();
      }
    } else if (event.keyCode == keycodes.ESC) {
      if ($scope.autocompletion && $scope.showAutocompletions) {
        $scope.$broadcast('cancelAutocompletion');
        $scope.clearAutocompletions();
        event.preventDefault();
      }
    } else if (event.keyCode == keycodes.ENTER) {
      if ($scope.autocompletion && $scope.showAutocompletions) {
        var e = $scope.$broadcast('submitAutocompletion');
        if (e.defaultPrevented) {
          $scope.submitSearch($scope.inner.term);
        } else {
          $scope.confirmAutocompletion();
        }
      toggleAutocompletions(false);
      } else {
        $scope.submitSearch($scope.inner.term);
      }
      event.preventDefault();
    }
  };

  $scope.updateFromButton = function () {
    $scope.submitSearch($scope.inner.term);
  };

  $scope.currentTokenContent = function () {
    var token = $scope.getCurrentToken();
    return token && token.content;
  };

  function toggleAutocompletions(show) {
    $scope.showAutocompletions = show;
    $scope.$emit('tokenizedSearchShowAutocompletions', show);
  }

  // FORMER LINK FUNCTION STUFF;

  var getSearchTerm = $parse($attrs.cfTokenizedSearch),
      setSearchTerm = getSearchTerm.assign;

  $scope.$watch(function (scope) {
    return getSearchTerm(scope.$parent);
  }, function (term) {
    $scope.inner.term = term;
  });

  $attrs.$observe('placeholder', function (placeholder) {
    $scope.placeholder = placeholder;
  });

  $scope.submitSearch = function (term) {
    setSearchTerm($scope.$parent, term);
    $scope.$emit('searchSubmitted', term);
  };

  $scope.hasFocus = false;

  $scope.inputFocused = function () {
    $scope.hasFocus = true;
    $scope.updateAutocompletions();
  };

  $scope.inputBlurred = function () {
    $scope.hasFocus = false;
  };

  $scope.leftSearch = function (event) {
    // If we clicked on a button in the datepicker the leftSearch will trigger although it
    // shouldn't because the DOM node has been removed and the parent lookup won't work correctly
    // http://stackoverflow.com/questions/22406505
    if ($(event.target).parents('[data-event=click]').length > 0) return;
    $scope.clearAutocompletions();
  };

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

  $scope.confirmAutocompletion = function () {
    var token = $scope.getCurrentToken();
    var originalString = $scope.inner.term || '';
    var appendString = token.type === 'Value'    ? ' ' :
                       token.type === 'Operator' ? '' :
                       /*token.type === Key*/      operator(token.content) + ' ';
    $scope.inner.term = spliceSlice(originalString, token.end, 0, appendString);
    $scope.clearBackupString();
    if(token.type === 'Value') $scope.submitSearch($scope.inner.term);
    $scope.selectRange(token.end + appendString.length, 0)
    .then(function () {
      $scope.position = token.end + appendString.length;
      $scope.updateAutocompletions();
    });

    function operator(key) {
      // TODO whoopsie, knowledge leaking here about internal structure of result. Should not.
      return searchQueryHelper.operatorsForKey(key, $scope.getContentType()).items[0].value;
    }
  };

  $scope._backupString=null;
  $scope.backupString = function (str, offset, length) {
    var b = str.slice(offset, offset+length);
    if (!$scope._backupString && b.length > 0) $scope._backupString = b;
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

  function spliceSlice(str, index, count, add) {
    return str.slice(0, index) + add + str.slice(index + count);
  }
  
});


