import { registerDirective } from 'NgRegistry';
import _ from 'lodash';

export default function register() {
  registerDirective('cfSelection', () => ({
    restrict: 'A',

    link: function (scope, el, attrs) {
      scope.$watch(
        () => _.every(getEntities(), scope.selection.isSelected),
        (isSelected) => {
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
    },
  }));
}
