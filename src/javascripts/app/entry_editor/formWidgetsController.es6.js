import { registerController } from 'NgRegistry.es6';
import * as K from 'utils/kefir.es6';

/**
 * @ngdoc type
 * @name FormWidgetsController
 * @description
 * Sets `$scope.widgets` to a list of widgets to render.
 *
 * TODO: This controller is responsible for conditional rendering. We
 * should remove it and instead handle conditional rendering in the
 * entity field directive.
 */
registerController('FormWidgetsController', [
  '$scope',
  'controls',
  ($scope, controls) => {
    const { validator } = $scope.editorContext;

    // Visibility can change when:
    // - "Show disabled fields" option is used.
    // - Validation errors change (we always show fields with errors).
    $scope.$watch(() => $scope.preferences.showDisabledFields, update);
    K.onValueScope($scope, validator.errors$, update);

    function update() {
      $scope.widgets = controls.map(markVisibility).filter(shouldRender);
    }

    // Adds `isVisible` property to a widget telling the editor
    // if the widget should be visible.
    function markVisibility(widget) {
      const isNotDisabled = !widget.field.disabled;
      const showingDisabled = $scope.preferences.showDisabledFields;
      const hasErrors = validator.hasFieldError(widget.field.id);

      return {
        ...widget,
        isVisible: isNotDisabled || showingDisabled || hasErrors
      };
    }

    // Determines if the widget should be rendered, either visible
    // or hidden in the background, depending on `isVisible`.
    function shouldRender(widget) {
      if (widget.isBackground) {
        return true;
      } else if (widget.sidebar) {
        return false;
      } else {
        return widget.isVisible;
      }
    }
  }
]);
