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
 */
.controller('FormWidgetsController',
['$scope', '$injector', 'contentTypeId', 'controls',
function ($scope, $injector, contentTypeId, controls) {

  var analytics = $injector.get('analyticsEvents');

  $scope.$watchGroup(
    ['preferences.showDisabledFields', 'errorPaths'],
    updateWidgets
  );

  // Executed only once when 'widgets' is not undefined.
  $scope.$watch('::widgets', function (widgets) {
    _.forEach(widgets, trackCustomWidgetRendered);
  });

  function trackCustomWidgetRendered (widget) {
    analytics.trackWidgetEventIfCustom(
      'Custom Widget rendered',
      widget, widget.field,
      { contentTypeId: contentTypeId }
    );
  }

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
    var hasErrors = $scope.errorPaths && $scope.errorPaths[field.id];
    return isNotDisabled || hasErrors;
  }

}]);
