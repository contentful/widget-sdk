'use strict';

angular.module('contentful').directive('cfLinkEditorSearch', function(defer) {
  return {
    restrict: 'AC',
    link: function (scope, element) {
      scope.clickOutsideHandler = function () {
        scope.searchResultsVisible = false;
      };

      scope.$watch('selectedEntity', function () {
        defer(scrollToSelected);
      });

      scope.$watch(function (scope) {
        return scope.searchResultsVisible;
      }, function (searchShown) {
        if (searchShown) defer(function(){
          element.find('> .results:visible').focus();
        });
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
    controller: 'cfLinkEditorSearchCtrl'
  };
});
