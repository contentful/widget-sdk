'use strict';

angular.module('contentful')

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
.controller('FormWidgetsController', ['$scope', 'require', 'controls', function ($scope, require, controls) {
  var K = require('utils/kefir');
  var trackCustomWidgets = require('analyticsEvents/customWidgets');
  var Focus = require('FieldControls/Focus');
  var validator = $scope.editorContext.validator;
  $scope.$watch('preferences.showDisabledFields', updateWidgets);
  K.onValueScope($scope, validator.errors$, updateWidgets);

  // Executed only once when 'widgets' is not undefined.
  $scope.$watch('::widgets', function (widgets) {
    _.forEach(widgets, function (widget) {
      trackCustomWidgets.rendered(widget, $scope.contentType, $scope.entry);
    });
  });

  /**
   * @ngdoc method
   * @name FormWidgetsController#focus.set
   * @param {string} fieldId
   */
  /**
   * @ngdoc method
   * @name FormWidgetsController#focus.unset
   * @param {string} fieldId
   */
  /**
   * @ngdoc method
   * @name FormWidgetsController#focus.onChanged
   * @param {function} callback
   */
  $scope.focus = Focus.create();

  function updateWidgets () {
    $scope.widgets = _.filter(controls, widgetIsVisible);
  }

  function widgetIsVisible (widget) {
    if (widget.sidebar) {
      return false;
    } else {
      return fieldIsVisible(widget.field);
    }
  }

  function fieldIsVisible (field) {
    if (!field) {
      return false;
    }
    var isNotDisabled = !field.disabled || $scope.preferences.showDisabledFields;
    var hasErrors = $scope.editorContext.validator.hasFieldError(field.id);
    return isNotDisabled || hasErrors;
  }

}])

.factory('FieldControls/Focus', ['$injector', function ($injector) {
  var Signal = $injector.get('signal');

  return {create: create};

  function create () {
    var focusedField = null;
    var focusedFieldSignal = Signal.createMemoized(null);

    return {
      set: function (id) {
        focusedField = id;
        focusedFieldSignal.dispatch(id);
      },
      unset: function (id) {
        if (focusedField === id) {
          focusedFieldSignal.dispatch(null);
        }
      },
      onChanged: focusedFieldSignal.attach
    };
  }
}]);
