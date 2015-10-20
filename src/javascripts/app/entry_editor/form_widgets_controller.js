'use strict';
angular.module('contentful')
.controller('FormWidgetsController',
  ['$scope', '$injector', 'contentType', 'editingInterface',
  function($scope, $injector, contentType, editingInterface) {
  var controller        = this;
  var TheLocaleStore    = $injector.get('TheLocaleStore');
  var widgets           = $injector.get('widgets');

  controller.contentType = contentType;
  controller.editingInterface = editingInterface;
  controller.updateWidgets = updateWidgets;

  $scope.$watch(getActiveLocaleCodes,                updateWidgets, true);
  $scope.$watch('preferences.showDisabledFields',    updateWidgets);
  $scope.$watch('errorPaths',                        updateWidgets);


  /**
   * Retrieve the widgets from the current editingInterface, build the
   * form widgets, and add them to the scope.
   */
  function updateWidgets() {
    $scope.widgets = _(controller.editingInterface.data.widgets)
      .filter(widgetIsVisible)
      .map(buildWidget)
      .value();
  }

  function buildWidget (widget) {
    var field = getFieldForWidget(widget);
    var locales = _(getFieldLocales(field))
      .union(getErrorLocales(field))
      .filter(_.isObject)
      .uniq('internal_code')
      .value();
    var defaultLocale = TheLocaleStore.getDefaultLocale();
    var renderable = widgets.buildRenderable(widget, locales, defaultLocale);
    renderable.field = field;
    return renderable;
  }


  function getActiveLocaleCodes() {
    return _.pluck(TheLocaleStore.getActiveLocales(), 'internal_code');
  }

  function widgetIsVisible(widget) {
    if (widget.widgetType === 'static') return true;
    var field = getFieldForWidget(widget);
    return widget.widgetType === 'static' || field && fieldIsEditable(field);
  }

  function fieldIsEditable(field) {
    return !field.disabled || $scope.preferences.showDisabledFields || $scope.errorPaths && $scope.errorPaths[field.id];
  }

  function getFieldForWidget(widget) {
    return _.find(controller.contentType.data.fields, {id: widget.fieldId});
  }

  function getFieldLocales(field) {
    if (field.localized)
      return TheLocaleStore.getActiveLocales();
    else
      return [TheLocaleStore.getDefaultLocale()];
  }

  function getErrorLocales(field) {
    return $scope.errorPaths && _.map($scope.errorPaths[field.id], function (code) {
      return _.find(TheLocaleStore.getPrivateLocales(), {internal_code: code});
    });
  }

}]);
