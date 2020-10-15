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
