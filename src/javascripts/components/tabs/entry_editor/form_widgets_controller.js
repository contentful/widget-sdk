'use strict';
angular.module('contentful').controller('FormWidgetsController', ['$scope', '$injector', function FormWidgetsController($scope, $injector){
  var controller        = this;
  var editingInterfaces = $injector.get('editingInterfaces');
  var TheLocaleStore    = $injector.get('TheLocaleStore');
  var widgets           = $injector.get('widgets');

  $scope.$watch(getContentTypeFields,                updateEditingInterface, true);
  $scope.$watch(getAvailableWidgets,                 updateWidgets, true);
  $scope.$watch(getActiveLocaleCodes,                updateWidgets, true);
  $scope.$watch(function() { return TheLocaleStore.getDefaultLocale();}, updateWidgets);
  $scope.$watch('preferences.showDisabledFields',    updateWidgets);
  $scope.$watch('errorPaths',                        updateWidgets);

  this.editingInterface = null;
  this.updateWidgets = updateWidgets;

  function updateEditingInterface() {
    if (controller.contentType) {
      editingInterfaces.forContentTypeWithId(controller.contentType, 'default')
      .then(function(interf) {
        controller.editingInterface = interf;
      });
    }
  }

  /**
   * Retrieve the widgets from the current editingInterface, build the
   * form widgets, and add them to the scope.
   */
  function updateWidgets() {
    if (!controller.editingInterface) {
      $scope.widgets = [];
      return;
    }

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


  function getAvailableWidgets() {
    return dotty.get(controller, 'editingInterface.data.widgets');
  }

  function getContentTypeFields() {
    return dotty.get(controller, 'contentType.data.fields');
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
      return _.find($scope.spaceContext.space.data.locales, {internal_code: code});
    });
  }

}]);
