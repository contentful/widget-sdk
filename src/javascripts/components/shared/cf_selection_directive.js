'use strict';

angular.module('contentful').directive('cfSelection', [function () {
  return {
    restrict: 'A',
    link: function (scope, el, attrs) {
      scope.$watch(function () {
        return _.every(getEntities(), scope.selection.isSelected);
      }, function (isSelected) {
        el.prop('checked', isSelected);
      });

      el.on('click', function (e) {
        // clicking on both cell and checkbox toggles the value
        // in some browsers checkbox events propagate through a checkbox
        // toggling the value twice (resulting in no visible change)
        e.stopPropagation();
      });

      el.on('change', function () {
        scope.$apply(function () {
          var method = el.prop('checked') ? 'add' : 'remove';
          _.forEach(getEntities(), scope.selection[method]);
        });
      });

      function getEntities() {
        var entities = scope.$eval(attrs.cfSelection);

        if (_.isArray(entities)) {
          return entities;
        } else if (_.isObject(entities)) {
          return [entities];
        } else {
          return [];
        }
      }
    }
  };
}]);
