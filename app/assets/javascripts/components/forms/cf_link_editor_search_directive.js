'use strict';

angular.module('contentful').directive('cfLinkEditorSearch', function(defer) {
  return {
    restrict: 'AC',
    controller: 'cfLinkEditorSearchCtrl',
    controllerAs: 'searchController',
    link: function (scope, element) {
      scope.clickOutsideHandler = function () {
        scope.searchController.hideSearchResults();
      };

      scope.$watch('selectedEntity', function () {
        defer(scrollToSelected);
      });

      function scrollToSelected(){
        var $selected = element.find('.selected');
        if ($selected.length === 0) return;
        var $container = element.find('.endless-container');
        var above = $selected.prop('offsetTop') <= $container.scrollTop();
        var below = $container.scrollTop() + $container.height() <= $selected.prop('offsetTop');
        if (above) {
          $container.scrollTop($selected.prop('offsetTop'));
        } else if (below) {
          $container.scrollTop($selected.prop('offsetTop')-$container.height() + $selected.height());
        }
      }
    },
  };
});
