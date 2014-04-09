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
        return scope.hasFocus && input.textrange('get').end;
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
          console.error('OOPS NO TOKEN IN fillAutoCompletion', scope.inner.term);
          token = {
            offset: scope.getPosition(),
            length: 0
          };
        }
        var isValue = token.type === 'Value';
        insertString = isValue ? scope.selectedAutocompletion+' ' : scope.selectedAutocompletion+':';
        scope.inner.term = spliceSlice(originalString, token.offset, token.length, insertString);
        _.defer(function () {
          input.textrange('set', token.offset + insertString.length);
        });
      };

      function spliceSlice(str, index, count, add) {
        return str.slice(0, index) + add + str.slice(index + count);
      }
    },

    controller: function ($scope) {
      $scope.inner = { term: null };
      $scope.autocompletions = [];
      $scope.selectedAutocompletion = null;

      $scope.getContentType = function () {
        var id = $scope.tab && $scope.tab.params && $scope.tab.params.contentTypeId;
        return $scope.spaceContext && $scope.spaceContext.getPublishedContentType && $scope.spaceContext.getPublishedContentType(id);
      };

      $scope.getCurrentToken = function () {
        return searchQueryHelper.currentSubToken($scope.inner.term, $scope.getPosition());
      };

      $scope.getCurrentPrefix = function () {
        // TODO SyntaxError: Invalid regular expression: /^\/: \ at end of pattern
        var token = $scope.getCurrentToken();
        if (token) return new RegExp('^'+token.text);
      };

      $scope.updateAutocompletions = function () {
        var contentType = $scope.getContentType(),
            term        = $scope.inner.term,
            position    = $scope.getPosition();
        $scope.autocompletions = searchQueryHelper.offerCompletion(contentType, term, position) || [];
      };

      $scope.selectNextAutocompletion = function () {
        var index = _.indexOf($scope.autocompletions, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletions[index+1] || $scope.autocompletions[0];
        $scope.selectTokenRange();
      };

      $scope.selectPreviousAutocompletion = function () {
        var index = _.indexOf($scope.autocompletions, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletions[index-1] || $scope.autocompletions[$scope.autocompletions.length-1];
        $scope.selectTokenRange();
      };

      $scope.$watchCollection(
        '[inner.term, getPosition(), getContentType()]', function (n, old, scope) {
          scope.updateAutocompletions();
        });

      $scope.inputChanged = function () {
        console.log('input changed');
      };

      $scope.keyPressed = function (event) {
        //console.log('keyPressed', event);
        //console.log('SearchkeyPressed, Term %o, Position %o, Pressed %o, Completions: %o', getSearchTerm(), getPosition(), event.keyCode, scope.autocompletions);
        if (event.keyCode == keycodes.DOWN){
          $scope.selectNextAutocompletion();
          event.preventDefault();
        } else if (event.keyCode == keycodes.UP) {
          $scope.selectPreviousAutocompletion();
          event.preventDefault();
        } else if (event.keyCode == keycodes.ESC) {
          $scope.selectedAutocompletion = null;
        } else if (event.keyCode == keycodes.ENTER) {
          if ($scope.selectedAutocompletion) {
            $scope.fillAutocompletion();
            $scope.selectedAutocompletion = null;
            event.preventDefault();
          }
        }
      };

      $scope.updateFromButton = function () {
        window.alert('button not implemented yet');
      };

    }
  };
});


