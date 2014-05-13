'use strict';

angular.module('contentful').directive('cfTokenizedSearch', function($parse, searchQueryHelper, keycodes){
  return {
    template: JST['cf_tokenized_search'](),
    scope: true,
    link: function(scope, element, attr) {
      var getSearchTerm = $parse(attr.cfTokenizedSearch),
          setSearchTerm = getSearchTerm.assign;

      scope.$watch(function (scope) {
        return getSearchTerm(scope.$parent);
      }, function (term) {
        scope.inner.term = term;
      });

      attr.$observe('placeholder', function (placeholder) {
        scope.placeholder = placeholder;
      });

      scope.submitSearch = function (term) {
        setSearchTerm(scope.$parent, term);
      };

      var input = element.find('input');
      scope.hasFocus = false;

      scope.inputFocused = function () {
        scope.hasFocus = true;
        scope.updateAutocompletions();
      };

      scope.inputBlurred = function () {
        scope.hasFocus = false;
      };

      scope.leftSearch = function (event) {
        // If we clicked on a button in the datepicker the leftSearch will trigger although it
        // shouldn't because the DOM node has been removed and the parent lookup won't work correctly
        // http://stackoverflow.com/questions/22406505
        if ($(event.target).parents('[data-event=click]').length > 0) return;
        scope.clearAutocompletions();
      };

      scope.getPosition = function () {
        return scope.hasFocus && input.textrange('get').start;
      };

      scope.selectTokenRange = function () {
        var token = scope.getCurrentToken();
        if (token) input.textrange('set', token.offset, token.end);
      };

      scope.fillAutocompletion = function (insertString) {
        var token = scope.getCurrentToken();
        var originalString = scope.inner.term || '';
        if (!token) {
          token = {
            offset: scope.position || 0,
            length: 0
          };
        }
        scope.backupString(originalString, token.offset, token.length);
        scope.inner.term = spliceSlice(originalString, token.offset, token.length, insertString);
        _.defer(function () {
          input.textrange('set', token.offset, insertString.length);
        });
      };

      scope.confirmAutocompletion = function () {
        var token = scope.getCurrentToken();
        var originalString = scope.inner.term || '';
        var insertString = token.type === 'Value'    ? ' ' :
                           token.type === 'Operator' ? ''  :
                           searchQueryHelper.operatorsForKey(token.content, scope.getContentType()).values[0];
        scope.inner.term = spliceSlice(originalString, token.end, 0, insertString);
        scope.clearBackupString();
        if(token.type === 'Value') scope.submitSearch(scope.inner.term);
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
        var b = str.slice(offset, offset+length);
        if (!scope._backupString && b.length > 0) scope._backupString = b;
      };

      scope.restoreString = function () {
        var token = scope.getCurrentToken();
        if (scope._backupString) {
          scope.inner.term = spliceSlice(scope.inner.term, token.offset, token.length, scope._backupString);
          scope._backupString = null;
        }
      };

      scope.clearBackupString = function () {
        scope._backupString = null;
      };

      function spliceSlice(str, index, count, add) {
        return str.slice(0, index) + add + str.slice(index + count);
      }
    },

    controller: function ($scope) {
      $scope.inner = { term: null };
      $scope.position = null;

      $scope.getContentType = function () {
        if ($scope.tab.viewType === 'entry-list') {
          var id = $scope.tab && $scope.tab.params && $scope.tab.params.contentTypeId;
          return $scope.spaceContext && $scope.spaceContext.getPublishedContentType && $scope.spaceContext.getPublishedContentType(id);
        }
        if ($scope.tab.viewType === 'asset-list') {
          return searchQueryHelper.assetContentType;
        }
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
        if ($scope.autocompletion) $scope.setAutocompletions();
      };

      $scope.setAutocompletions = function () {
        var contentType = $scope.getContentType(),
            space       = $scope.spaceContext.space,
            term        = $scope.inner.term,
            position    = $scope.position;
        searchQueryHelper.offerCompletion(space, contentType, term, position)
        .then(function (completion) {
          $scope.autocompletion = completion;
        });
      };

      $scope.clearAutocompletions = function () {
        $scope.restoreString();
        $scope.autocompletion = null;
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
        $scope.$broadcast('autocompletionKeypress', event);
        if (event.keyCode == keycodes.DOWN){
          if (!$scope.autocompletion) $scope.setAutocompletions();
          if ($scope.autocompletion) {
            $scope.$broadcast('selectNextAutocompletion');
            event.preventDefault();
          }
        } else if (event.keyCode == keycodes.UP) {
          if (!$scope.autocompletion) $scope.setAutocompletions();
          if ($scope.autocompletion) {
            $scope.$broadcast('selectPreviousAutocompletion');
            event.preventDefault();
          }
        } else if (event.keyCode == keycodes.ESC) {
          if ($scope.autocompletion){
            $scope.$broadcast('cancelAutocompletion');
            $scope.clearAutocompletions();
            event.preventDefault();
          }
        } else if (event.keyCode == keycodes.ENTER) {
          if ($scope.autocompletion) {
            $scope.$broadcast('submitAutocompletion');
            $scope.confirmAutocompletion();
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
        return token.content;
      };
    }
  };
});


