'use strict';
angular.module('contentful').directive('offerAutocompletions', function(searchQueryHelper, keycodes){
  return {
    link: function(scope, elem){
      var oldTerm;
      var input = elem.find('input');

      //elem.on('keydown', function (event) {
      scope.$on('searchKeyPressed', function(ngEvent, event){
        //scope.$apply(function (scope) {
          var contentType = scope.spaceContext.getPublishedContentType(scope.tab.params.contentTypeId);
          var term        = input.val();
          var position    = input.textrange('get').end;
          var autocompletions = searchQueryHelper.offerCompletion(contentType, term, position);
          scope.setAutocompletions(autocompletions);
          // TODO reset current autocompletion
          if (event.keyCode == keycodes.DOWN){
            scope.showAutocompletions();
            scope.selectNextAutocompletion();
            event.preventDefault();
          } else if (event.keyCode == keycodes.UP) {
            scope.showAutocompletions();
            scope.selectNextAutocompletion();
            event.preventDefault();
          } else if (event.keyCode == keycodes.ESC) {
            scope.hideAutocompletions();
          } else if (event.keyCode == keycodes.ENTER) {
            if (scope.selectedAutocompletion) scope.fillAutocompletion(scope.selectedAutocompletion);
          } else if (term === oldTerm) {
            // Moved cursor, do nothing
          } else {
            // Typed, term has changed
            scope.showAutocompletions();
          }
          oldTerm = term;
        //});
      });

      scope.fillAutocompletion = function (wat) {
        // TODO: Current token finden (auch innerhalb pairs) und das token ersetzen
        input.textrange('insert', wat);
      };
      //scope.$on('searchChanged', function (event, term, position) {
        //var contentType;$scope.spaceContext.getPublishedContentType($scope.tab.params.contentTypeId).getName() :
        //scope.autocompletions = searchQueryHelper.offerCompletion(contentType, term, position);
      //});
    },
    controller: function ($scope) {
      $scope.autocompletions = [];
      $scope.selectedAutocompletion = null;
      $scope.autocompletionsVisible = false;

      $scope.setAutocompletions = function (autocompletions) {
        if (!angular.equals(autocompletions, $scope.autocompletions)) {
          $scope.selectedAutocompletion = null;
        }
        $scope.autocompletions = autocompletions;
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
