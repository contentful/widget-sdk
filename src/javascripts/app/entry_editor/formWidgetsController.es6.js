import { registerController } from 'NgRegistry.es6';
import * as K from 'utils/kefir.es6';

export default function register() {
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
      // Visibility can change when:
      // - "Show disabled fields" option is used.
      // - The single/multi-locale mode is toggled.
      // - The focused locale is changed (from the single-locale mode).
      // - Validation errors change (we always show fields with errors).
      $scope.$watchGroup(
        [
          '$scopepreferences.showDisabledFields',
          'localeData.isSingleLocaleModeOn',
          'localeData.focusedLocale'
        ],
        update
      );
      K.onValueScope($scope, $scope.editorContext.validator.errors$, update);

      function update() {
        const nonLocalizedFieldsAreDisplayable = areNonLocalizedFieldsDisplayable();
        $scope.widgets = controls
          .map(widget => markVisibility(widget, nonLocalizedFieldsAreDisplayable))
          .filter(shouldRender);
      }

      // Adds `isVisible` property to a widget telling the editor
      // if the widget should be visible.
      function markVisibility(widget, nonLocalizedFieldsAreDisplayable) {
        const isNonDisplayableNonLocalizedField =
          !nonLocalizedFieldsAreDisplayable && !widget.field.localized;
        const isNotDisabled = !widget.field.disabled;
        const showingDisabled = $scope.preferences.showDisabledFields;
        const hasErrors = $scope.editorContext.validator.hasFieldError(widget.field.id);

        return {
          ...widget,
          isVisible:
            !isNonDisplayableNonLocalizedField && (isNotDisabled || showingDisabled || hasErrors)
        };
      }

      function areNonLocalizedFieldsDisplayable() {
        const { localeData } = $scope;
        if (!localeData.isSingleLocaleModeOn) {
          return true;
        } else {
          return localeData.focusedLocale.internal_code === localeData.defaultLocale.internal_code;
        }
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
}
