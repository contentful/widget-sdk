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
// TODO dependency on content type is only there because of id. We
// should only depend on 'contentTypeId'.
.controller('FormWidgetsController',
  ['$scope', '$injector', 'contentType', 'widgets',
  function($scope, $injector, contentType, widgets) {

  var Widgets = $injector.get('widgets');
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
      { contentTypeId: contentType.getId() }
    );
  }

  /**
   * Retrieve the widgets from the current editingInterface, build the
   * form widgets, and add them to the scope.
   */
  function updateWidgets () {
    $scope.widgets = _(widgets)
      .map(Widgets.buildRenderable)
      .filter(widgetIsVisible)
      .value();
  }

  function widgetIsVisible(widget) {
    if (widget.sidebar){
      return false;
    } else {
      return fieldIsVisible(widget.field);
    }
  }

  function fieldIsVisible (field) {
    var isNotDisabled = !field.disabled || $scope.preferences.showDisabledFields;
    var hasErrors = $scope.errorPaths && $scope.errorPaths[field.id];
    return isNotDisabled || hasErrors;
  }

}]);
