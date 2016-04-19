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
