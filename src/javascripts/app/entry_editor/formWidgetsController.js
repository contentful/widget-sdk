import { registerController } from 'NgRegistry';
import * as K from 'utils/kefir';

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
          'preferences.showDisabledFields',
          'localeData.isSingleLocaleModeOn',
          'localeData.focusedLocale'
        ],
        update
      );
      K.onValueScope($scope, $scope.editorContext.validator.errors$, update);

      function update() {
        $scope.widgets = controls.map(markVisibility).filter(shouldRender);
        $scope.shouldDisplayNoLocalizedFieldsAdvice = $scope.widgets.every(
          w => w.isVisible === false
        );
      }

      // Adds `isVisible` property to a widget telling the editor
      // if the widget should be visible.
      function markVisibility(widget) {
        const isNotDisabled = !widget.field.disabled;
        const showingDisabled = $scope.preferences.showDisabledFields;
        const { focusedLocale, defaultLocale, isSingleLocaleModeOn } = $scope.localeData;

        let isVisible;
        if (isSingleLocaleModeOn) {
          const hasFieldLocaleErrors = $scope.editorContext.validator.hasFieldLocaleError(
            widget.field.id,
            focusedLocale.internal_code
          );
          const isNonDefaultLocale = focusedLocale.internal_code !== defaultLocale.internal_code;

          isVisible =
            isNonDefaultLocale && !widget.field.localized
              ? hasFieldLocaleErrors
              : isNotDisabled || showingDisabled || hasFieldLocaleErrors;
        } else {
          const hasFieldErrors = $scope.editorContext.validator.hasFieldError(widget.field.id);
          isVisible = isNotDisabled || showingDisabled || hasFieldErrors;
        }

        return { ...widget, isVisible };
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
