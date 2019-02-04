import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import KEYCODES from 'utils/keycodes.es6';

function constraintsType(sizeConstraints) {
  if (_.isNumber(sizeConstraints.min) && _.isNumber(sizeConstraints.max)) {
    return 'min-max';
  } else if (_.isNumber(sizeConstraints.min)) {
    return 'min';
  } else if (_.isNumber(sizeConstraints.max)) {
    return 'max';
  } else {
    return null;
  }
}

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfTagEditor
   */
  registerDirective('cfTagEditor', () => ({
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    template: JST.cf_tag_editor(),
    link: function($scope, _el, _attrs, widgetApi) {
      const field = widgetApi.field;

      $scope.constraints =
        _(field.validations)
          .map('size')
          .filter()
          .first() || {};

      /**
       * @ngdoc property
       * @name cfTagEditor#$scope.constraintsType
       * @type {string}
       * @description
       * One of 'min-max', 'min', and 'max'.
       */
      $scope.constraintsType = constraintsType($scope.constraints);

      /**
       * @ngdoc method
       * @name cfTagEditor#$scope.items
       * @type {string[]}
       */
      const offValueChanged = field.onValueChanged(items => {
        items = items || [];
        // We make a copy so we do not modify the object in the
        // snapshot.
        $scope.items = items.slice();
      });
      $scope.$on('$destroy', offValueChanged);

      /**
       * @ngdoc property
       * @name cfTagEditor#$scope.isEmpty
       * @type {boolean}
       */
      $scope.$watch('items.length', length => {
        $scope.isEmpty = length === 0;
      });

      /**
       * @ngdoc method
       * @name cfTagEditor#$scope.isDisabled
       * @type {boolean}
       */
      field.onIsDisabledChanged(isDisabled => {
        $scope.isDisabled = isDisabled;
      });

      /**
       * @ngdoc method
       * @name cfTagEditor#$scope.addItem
       * @param {Event} event
       */
      $scope.addItem = ev => {
        const value = ev.target.value;
        if (ev.keyCode === KEYCODES.ENTER && value) {
          $scope.items.push(value);
          field.pushValue(value);
          ev.target.value = '';
        }
      };

      /**
       * @ngdoc method
       * @name cfTagEditor#$scope.removeItem
       * @param {number} index
       */
      $scope.removeItem = i => {
        $scope.items.splice(i, 1);
        if ($scope.items.length === 0) {
          field.removeValue();
        } else {
          field.removeValueAt(i);
        }
      };
    }
  }));
}
