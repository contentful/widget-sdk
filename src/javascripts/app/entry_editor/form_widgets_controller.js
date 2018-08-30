'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc type
   * @name FormWidgetsController
   * @description
   * Sets `$scope.widgets` to a list of widgets to render.
   *
   * Widgets are constructed by using the 'contentType' and
   * 'editingInterface' parameters. These do not change.
   *
   * The active locales, the 'showDisabledFields' preference and the
   * error paths determine dynamically for which fields and which locales
   * widgets should be rendered.
   *
   * TODO This controller is responsible for conditional rendering. We
   * should remove it and instead handle conditional rendering in the
   * entity field directive. This wasy we can do without the list
   * manipulation.
   */
  .controller('FormWidgetsController', [
    '$scope',
    'require',
    'controls',
    ($scope, require, controls) => {
      const K = require('utils/kefir.es6');
      const trackCustomWidgets = require('analyticsEvents/customWidgets');

      // Widgets, which we need to instantiate, even despite
      // they are not visible. For example, we need a
      // slugEditor in the background, because it depends
      // on a title, even if it is hidden, so we don't have
      // empty string after publishing
      //
      // we keep this object inside the controller to avoid
      // global object's polluting
      const BACKGROUND_WIDGETS = {
        slugEditor: true
      };

      const validator = $scope.editorContext.validator;
      $scope.$watch('preferences.showDisabledFields', updateWidgets);
      K.onValueScope($scope, validator.errors$, updateWidgets);

      // Executed only once when `$scope.widgets` is not undefined.
      $scope.$watch('::widgets', widgets => {
        _.forEach(widgets, widget => {
          trackCustomWidgets.rendered(widget, $scope.contentType, $scope.entry);
        });
      });

      function updateWidgets() {
        $scope.widgets = controls.map(markWidgetVisibility).filter(widgetShouldBeListed);
      }

      // we mark them with a property, because we
      // might want to have an invisible widget
      // in the background
      function markWidgetVisibility(widget) {
        return _.assign(
          {
            isVisible: fieldIsVisible(widget.field)
          },
          widget
        );
      }

      function widgetShouldBeListed(widget) {
        if (BACKGROUND_WIDGETS[widget.widgetId]) {
          return true;
        } else if (widget.sidebar) {
          return false;
        } else {
          return widget.isVisible;
        }
      }

      function fieldIsVisible(field) {
        if (!field) {
          return false;
        }
        const isNotDisabled = !field.disabled || $scope.preferences.showDisabledFields;
        const hasErrors = $scope.editorContext.validator.hasFieldError(field.id);
        return isNotDisabled || hasErrors;
      }
    }
  ]);
