'use strict';

angular.module('contentful').directive('cfTokenizedSearch', function($parse, searchQueryHelper, keycodes){
  return {
    template: JST['cf_tokenized_search'](),
    scope: {
      placeholder: '@',
      search: '=cfTokenizedSearch',
      tooltip: '@'
    },

    link: function(scope, element) {
      var input = element.find('input');
      scope.hasFocus = false;

      scope.inputFocused = function () {
        scope.hasFocus = true;
        scope.updateAutocompletions();
      };

      scope.inputBlurred = function () {
        scope.hasFocus = false;
      };

      scope.getPosition = function () {
        return scope.hasFocus && input.textrange('get').start;
      };

      scope.selectTokenRange = function () {
        var token = scope.getCurrentToken();
        if (token) input.textrange('set', token.offset, token.end);
      };

      scope.fillAutocompletion = function () {
        var token = scope.getCurrentToken();
        var originalString = scope.inner.term || '';
        var insertString;
        if (!token) {
          token = {
            offset: scope.position || 0,
            length: 0
          };
        }
        insertString = scope.selectedAutocompletion;
        scope.backupString(originalString, token.offset, token.length);
        scope.inner.term = spliceSlice(originalString, token.offset, token.length, insertString);
        _.defer(function () {
          input.textrange('set', token.offset, insertString.length);
        });
      };

      scope.confirmAutocompletion = function () {
        var token = scope.getCurrentToken();
        var originalString = scope.inner.term || '';
        var insertString = token.type === 'Key'   ? ''  :
                           token.type === 'Query' ? ':' :
                           ' ';
        scope.inner.term = spliceSlice(originalString, token.end, 0, insertString);
        _.defer(function () {
          input.textrange('set', token.end + insertString.length, 0);
          scope.$apply(function (scope) {
            scope.position = token.end + insertString.length;
            scope.updateAutocompletions();
          });
        });
      };

      scope._backupString=null;
      scope.backupString = function (str, offset, length) {
        if (!scope._backupString) scope._backupString = str.slice(offset, length);
      };

      scope.restoreString = function () {
        var token = scope.getCurrentToken();
        if (scope._backupString) {
          scope.inner.term = spliceSlice(scope.inner.term, token.offset, token.length, scope._backupString);
          scope._backupString = null;
        }
      };

      function spliceSlice(str, index, count, add) {
        return str.slice(0, index) + add + str.slice(index + count);
      }
    },

    controller: function ($scope) {
      $scope.inner = { term: null };
      $scope.autocompletions = [];
      $scope.selectedAutocompletion = null;
      $scope.position = null;

      $scope.getContentType = function () {
        var id = $scope.tab && $scope.tab.params && $scope.tab.params.contentTypeId;
        return $scope.spaceContext && $scope.spaceContext.getPublishedContentType && $scope.spaceContext.getPublishedContentType(id);
      };

      $scope.getCurrentToken = function () {
        return searchQueryHelper.currentSubToken($scope.inner.term, $scope.position);
      };

      $scope.getCurrentPrefix = function () {
        // TODO SyntaxError: Invalid regular expression: /^\/: \ at end of pattern
        var token = $scope.getCurrentToken();
        if (token) return new RegExp('^'+token.text);
      };

      $scope.updateAutocompletions = function () {
        var contentType = $scope.getContentType(),
            term        = $scope.inner.term,
            position    = $scope.position;
        $scope.autocompletions = searchQueryHelper.offerCompletion(contentType, term, position) || [];
      };

      $scope.selectNextAutocompletion = function () {
        var index = _.indexOf($scope.autocompletions, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletions[index+1] || $scope.autocompletions[0];
        if ($scope.selectedAutocompletion) $scope.fillAutocompletion();
      };

      $scope.selectPreviousAutocompletion = function () {
        var index = _.indexOf($scope.autocompletions, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletions[index-1] || $scope.autocompletions[$scope.autocompletions.length-1];
        if ($scope.selectedAutocompletion) $scope.fillAutocompletion();
      };

      $scope.$watch('getContentType()', 'updateAutocompletions()');

      $scope.inputChanged = function () {
        $scope.updateAutocompletions();
      };

      $scope.keyReleased = function () {
        if ($scope.position !== $scope.getPosition()) {
          $scope.position = $scope.getPosition();
          $scope.updateAutocompletions();
        }
      };

      $scope.keyPressed = function (event) {
        if (event.keyCode == keycodes.DOWN){
          $scope.selectNextAutocompletion();
          if ($scope.selectedAutocompletion) event.preventDefault();
        } else if (event.keyCode == keycodes.UP) {
          $scope.selectPreviousAutocompletion();
          event.preventDefault();
          if ($scope.selectedAutocompletion) event.preventDefault();
        } else if (event.keyCode == keycodes.ESC) {
          if ($scope.selectedAutocompletion) {
            $scope.restoreString();
            $scope.selectedAutocompletion = null;
            event.preventDefault();
          }
        } else if (event.keyCode == keycodes.ENTER) {
          if ($scope.selectedAutocompletion) {
            $scope.confirmAutocompletion();
            $scope.selectedAutocompletion = null;
            event.preventDefault();
          } else {
            $scope.search = $scope.inner.term;
          }
        }
      };

      $scope.updateFromButton = function () {
        window.alert('button not implemented yet');
      };

    }
  };
});


