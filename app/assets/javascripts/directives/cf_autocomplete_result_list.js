'use strict';

angular.module('contentful').directive('cfAutocompleteResultList', function() {
  return {
    link: function (scope, element) {
      element.on('keydown', function navigateResultList(event) {
        var DOWN  = 40,
            UP    = 38,
            ENTER = 13,
            ESC   = 27;

        if (event.keyCode == DOWN){
          if (scope.hasResults()) {
            scope.selectNext();
            scope.$digest();
          }
          event.preventDefault();
        } else if (event.keyCode == UP) {
          if (scope.hasResults()) {
            scope.selectPrevious();
            scope.$digest();
          }
          event.preventDefault();
        } else if (event.keyCode == ESC) {
          if (scope.hasResults()) {
            scope.$apply(function(scope) {
              scope.closePicker();
            });
            event.preventDefault();
          }
        } else if (event.keyCode == ENTER) {
          if (scope.hasResults()) {
            scope.$apply(function(scope) {
              scope.pickSelected();
            });
          }
          event.preventDefault();
          event.stopPropagation();
        }
      });

      scope.hasResults = function () {
        return scope.entries && scope.entries.length > 0;
      };

      scope.selectNext = function() {
        if (scope.selectedItem < scope.paginator.numEntries-1) {
          scope.selectedItem++;
          _.defer(scrollToSelected);
        }
      };

      scope.selectPrevious = function() {
        if (0 < scope.selectedItem) scope.selectedItem--;
        _.defer(scrollToSelected);
      };

      scope.closePicker = function() {
        scope.searchTerm = '';
      };

      scope.pick = function (entry) {
        scope.addLink(entry, function(err) {
          if (!err) scope.closePicker();
        });
      };

      scope.pickSelected = function() {
        var entry = scope.entries[scope.selectedItem];
        if (entry) scope.pick(entry);
      };

      function scrollToSelected(){
        var selected = element.find('.selected')[0];
        var $container = element.find('.endless-container');
        var above = selected.offsetTop <= $container.scrollTop();
        var below = $container.scrollTop() + $container.height()<= selected.offsetTop;
        if (above) {
          selected.scrollIntoView(true);
        } else if (below) {
          selected.scrollIntoView(false);
        }
      }
  }};
});
