'use strict';

angular.module('contentful').directive('cfSelection', [() => ({
  restrict: 'A',

  link: function (scope, el, attrs) {
    scope.$watch(() => _.every(getEntities(), scope.selection.isSelected), isSelected => {
      el.prop('checked', isSelected);
    });

    function getEntities () {
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
})]);
