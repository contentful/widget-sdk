'use strict';

angular.module('contentful').directive('cfSelection', [
  'require',
  require => {
    const _ = require('lodash');
    return {
      restrict: 'A',

      link: function(scope, el, attrs) {
        scope.$watch(
          () => _.every(getEntities(), scope.selection.isSelected),
          isSelected => {
            el.prop('checked', isSelected);
          }
        );

        function getEntities() {
          const entities = scope.$eval(attrs.cfSelection);

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
  }
]);
