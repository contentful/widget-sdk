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
        var insertString = token.type === 'Value'    ? ' ' :
                           token.type === 'Operator' ? ''  :
                           searchQueryHelper.operatorsForKey(token.content, scope.getContentType())[0];
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
        if (!scope._backupString) scope._backupString = str.slice(offset, length);
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
      $scope.autocompletions = [];
      $scope.selectedAutocompletion = null;
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
        var contentType = $scope.getContentType(),
            space       = $scope.spaceContext.space,
            term        = $scope.inner.term,
            position    = $scope.position;
        searchQueryHelper.offerCompletion(space, contentType, term, position)
        .then(function (completions) {
          if (_.isArray(completions)){
            $scope.autocompletions = completions;
            $scope.specialCompletion = null;
          } else if (_.isString(completions)) {
            $scope.autocompletions = [];
            $scope.specialCompletion = completions;
            $scope.$broadcast('autocompletionsUpdated');
          } else {
            $scope.autocompletions = [];
            $scope.specialCompletion = null;
          }
        });
      };

      $scope.clearAutocompletions = function () {
        $scope.restoreString();
        $scope.selectedAutocompletion = null;
        $scope.specialCompletion = null;
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
          autocompletionKeypress(event);
        } else if (event.keyCode == keycodes.UP) {
          $scope.selectPreviousAutocompletion();
          event.preventDefault();
          if ($scope.selectedAutocompletion) event.preventDefault();
          autocompletionKeypress(event);
        } else if (event.keyCode == keycodes.ESC) {
          if ($scope.selectedAutocompletion) {
            $scope.restoreString();
            $scope.selectedAutocompletion = null;
            event.preventDefault();
          } else if ($scope.specialCompletion) {
            autocompletionKeypress(event);
            event.preventDefault();
          }
        } else if (event.keyCode == keycodes.ENTER) {
          if ($scope.selectedAutocompletion) {
            $scope.confirmAutocompletion();
            $scope.selectedAutocompletion = null;
            event.preventDefault();
          } else if ($scope.specialCompletion) {
            var e = autocompletionKeypress(event);
            if (!e.defaultPrevented) $scope.submitSearch($scope.inner.term);
            event.preventDefault();
          } else {
            $scope.submitSearch($scope.inner.term);
          }
        }
      };

      // TODO Put different autocompletion modes into different modules,
      // then handle completion management there. TokenizedSearch should only
      // a) call into those modules
      // b) perform manipulation of the Search field

      $scope.updateFromButton = function () {
        $scope.submitSearch($scope.inner.term);
      };

      $scope.fillSpecialCompletion = function (value) {
        var old = $scope.selectedAutocompletion;
        $scope.selectedAutocompletion = value;
        $scope.fillAutocompletion();
        $scope.selectedAutocompletion = old;
      };

      $scope.readSpecialCompletion = function () {
        var token = $scope.getCurrentToken();
        return token.content;
      };

      function autocompletionKeypress(event) {
        return $scope.$broadcast('autocompletionKeypress', event);
      }
    }
  };
});


