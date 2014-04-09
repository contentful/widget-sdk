'use strict';
angular.module('contentful').directive('offerAutocompletions', function(searchQueryHelper, keycodes){
  return {
    link: function(scope, elem){
      var input = elem.find('input');

      function getPosition() {
        return input.textrange('get').start;
      }

      function getContentType() {
        var id = scope.tab && scope.tab.params && scope.tab.params.contentTypeId;
        return scope.spaceContext && scope.spaceContext.getPublishedContentType && scope.spaceContext.getPublishedContentType(id);
      }
      
      function getSearchTerm() {
        return input.val();
      }

      function getToken() {
        return searchQueryHelper.currentSubToken(getSearchTerm(), getPosition());
      }

      scope.$watch(function (scope) {
        return [getSearchTerm(), getPosition(), scope.tab.params.contentTypeId];
      }, function (n, old, scope) {
        var term = n[0], position = n[1], oldTerm = old[0];
        var contentType = getContentType();
        var autocompletions = searchQueryHelper.offerCompletion(contentType, term, position);
        //console.log('autocompletions updated, Term %o, Position %o, Pressed %o, Completions: %o', getSearchTerm(), position, event, scope.autocompletions);
        if (term !== oldTerm) scope.showAutocompletions();
        scope.setAutocompletions(autocompletions);
      }, true);

      scope.$on('searchKeyPressed', function(ngEvent, event){
        console.log('SearchkeyPressed, Term %o, Position %o, Pressed %o, Completions: %o', getSearchTerm(), getPosition(), event.keyCode, scope.autocompletions);
        if (event.keyCode == keycodes.DOWN){
          scope.showAutocompletions();
          scope.selectNextAutocompletion();
          event.preventDefault();
        } else if (event.keyCode == keycodes.UP) {
          scope.showAutocompletions();
          scope.selectPreviousAutocompletion();
          event.preventDefault();
        } else if (event.keyCode == keycodes.ESC) {
          if (scope.autocompletionsVisible) {
            scope.hideAutocompletions();
            event.preventDefault();
          }
        } else if (event.keyCode == keycodes.ENTER) {
          if (scope.selectedAutocompletion) {
            scope.fillAutocompletion(scope.selectedAutocompletion);
            scope.hideAutocompletions();
            event.preventDefault();
          }
        }
      });

      scope.fillAutocompletion = function (wat) {
        var token = getToken();
        if (token) {
          var isValue = token.type === 'Value' || token.type === 'Novalue';
          var suffix = isValue ? ' ' : ':';
          input.textrange('set', token.offset, token.end);
          input.textrange('replace', wat + suffix);
        } else {
          input.textrange('insert', wat+':');
        }
        var end = input.textrange('get').end;
        input.textrange('set', end);
        // TODO This should not be necessary. We need to write a new
        // search field that better intgrates the autocompletion instead of bolting on
        // functionality through the offer_autocompletions directive.
        input.controller('ngModel').$setViewValue(input.val());
      };

      scope.selectTokenRange = function () {
        var token = getToken();
        if (token) input.textrange('set', token.offset, token.end);
      };

      scope.getCurrentPrefix = function () {
        var token = getToken();
        if (token) return new RegExp('^'+token.text);
      };
    },

    controller: function ($scope) {
      $scope.autocompletions = [];
      $scope.selectedAutocompletion = null;
      $scope.autocompletionsVisible = false;

      $scope.setAutocompletions = function (autocompletions) {
        if (!angular.equals(autocompletions, $scope.autocompletions)) {
          $scope.selectedAutocompletion = null;
        }
        $scope.autocompletions = autocompletions || [];
        var prefix = $scope.getCurrentPrefix();
        if (prefix) {
          $scope.selectedAutocompletion = _.find($scope.autocompletions, function (ac) {
            return prefix.test(ac);
          });
          if (!$scope.selectedAutocompletion) $scope.autocompletionsVisible = false;
        }

      };

      $scope.showAutocompletions = function () {
        $scope.autocompletionsVisible = true;
      };

      $scope.hideAutocompletions = function () {
        $scope.autocompletionsVisible = false;
      };

      $scope.selectNextAutocompletion = function () {
        var index = _.indexOf($scope.autocompletions, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletions[index+1] || $scope.autocompletions[0];
      };

      $scope.selectPreviousAutocompletion = function () {
        var index = _.indexOf($scope.autocompletions, $scope.selectedAutocompletion);
        $scope.selectedAutocompletion = $scope.autocompletions[index-1] || $scope.autocompletions[$scope.autocompletions.length-1];
      };
    }
  };
});
