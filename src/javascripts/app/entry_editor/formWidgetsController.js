import { registerController, getModule } from 'core/NgRegistry';
import * as K from 'core/utils/kefir';
import { makeFieldLocaleListeners } from './makeFieldLocaleListeners';

// Determines if the widget should be rendered, either visible
// or hidden in the background, depending on `isVisible`.
function shouldRender(widget) {
  if (widget.isBackground) {
    return true;
  } else if (widget.sidebar) {
    return false;
  }
  return widget.isVisible;
}

export const filterWidgets = (localeData, editorContext, controls, showDisabledFields) => {
  // Adds `isVisible` property to a widget telling the editor
  // if the widget should be visible.
  function markVisibility(widget) {
    const isNotDisabled = !widget.field.disabled;
    const { focusedLocale, defaultLocale, isSingleLocaleModeOn } = localeData;

    let isVisible;
    if (isSingleLocaleModeOn) {
      const hasFieldLocaleErrors = editorContext.validator.hasFieldLocaleError(
        widget.field.id,
        focusedLocale.internal_code
      );
      const isNonDefaultLocale = focusedLocale.internal_code !== defaultLocale.internal_code;

      isVisible =
        isNonDefaultLocale && !widget.field.localized
          ? hasFieldLocaleErrors
          : isNotDisabled || showDisabledFields || hasFieldLocaleErrors;
    } else {
      const hasFieldErrors = editorContext.validator.hasFieldError(widget.field.id);
      isVisible = isNotDisabled || showDisabledFields || hasFieldErrors;
    }

    return {
      ...widget,
      isVisible,
    };
  }

  const widgets = controls.map(markVisibility).filter(shouldRender);
  const shouldDisplayNoLocalizedFieldsAdvice = widgets.every((w) => w.isVisible === false);

  return { shouldDisplayNoLocalizedFieldsAdvice, widgets };
};

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
    function FormWidgetsController($scope, controls) {
      // Visibility can change when:
      // - "Show disabled fields" option is used.
      // - The single/multi-locale mode is toggled.
      // - The focused locale is changed (from the single-locale mode).
      // - Validation errors change (we always show fields with errors).
      $scope.$watchGroup(
        [
          'preferences.showDisabledFields',
          'localeData.isSingleLocaleModeOn',
          'localeData.focusedLocale',
        ],
        update
      );
      K.onValueScope($scope, $scope.editorContext.validator.errors$, update);

      $scope.fieldLocaleListeners = makeFieldLocaleListeners(
        controls.form.concat(controls.sidebar),
        $scope,
        getModule('$controller')
      );

      function update() {
        const { widgets, shouldDisplayNoLocalizedFieldsAdvice } = filterWidgets(
          $scope.localeData,
          $scope.editorContext,
          controls.form,
          $scope.preferences.showDisabledFields
        );
        $scope.widgets = widgets;
        $scope.shouldDisplayNoLocalizedFieldsAdvice = shouldDisplayNoLocalizedFieldsAdvice;
      }
    },
  ]);
}
