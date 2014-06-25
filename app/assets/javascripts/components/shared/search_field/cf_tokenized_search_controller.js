'use strict';

angular.module('contentful').controller('cfTokenizedSearchController', function ($scope, searchQueryHelper, keycodes) {
  $scope.inner = { term: null };
  $scope.position = null;
  $scope.showAutocompletions = false;

  $scope.getContentType = function () {
    if ($scope.tab.viewType === 'entry-list') {
      var id = $scope.tab && $scope.tab.params && $scope.tab.params.view && $scope.tab.params.view.contentTypeId;
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
    .then(function (completion) {
      $scope.autocompletion = completion;
      $scope.$broadcast('autocompletionsUpdated', completion);
    });
  };

  $scope.clearAutocompletions = function () {
    $scope.restoreString();
    $scope.showAutocompletions = false;
  };

  $scope.$watch('getContentType()', 'updateAutocompletions()');

  $scope.inputChanged = function () {
    // TODO: This is necessary because $scope.position will only be updated in the next digtest cycle.
    // When deleting from the end, this can cause the position to be $scope.inner.term.length + 1
    // which gives a current token of undefined
    $scope.position = $scope.getPosition();
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
      $scope.showAutocompletions = true;
      if ($scope.autocompletion && $scope.showAutocompletions) {
        $scope.$broadcast('selectNextAutocompletion');
        event.preventDefault();
      }
    } else if (event.keyCode == keycodes.UP) {
      $scope.showAutocompletions = true;
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
        $scope.showAutocompletions = false;
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
});


