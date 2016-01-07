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
  ['$scope', '$injector', 'contentType', 'editingInterface',
  function($scope, $injector, contentType, editingInterface) {
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var widgets        = $injector.get('widgets');

  $scope.$watch(getActiveLocaleCodes,             updateWidgets, true);
  $scope.$watch('preferences.showDisabledFields', updateWidgets);
  $scope.$watch('errorPaths',                     updateWidgets);


  /**
   * Retrieve the widgets from the current editingInterface, build the
   * form widgets, and add them to the scope.
   */
  function updateWidgets() {
    $scope.widgets = _(editingInterface.data.widgets)
      .map(buildWidget)
      .filter(widgetIsVisible)
      .value();
  }

  function buildWidget (widget) {
    var field = getFieldForWidget(widget);
    // TODO we should use `fieldFactory.getLocaleCodes(field)`
    var locales = _(getFieldLocales(field))
      .union(getErrorLocales(field))
      .filter(_.isObject)
      .uniq('internal_code')
      .value();
    var renderable = widgets.buildRenderable(widget, locales);
    renderable.field = field;
    return renderable;
  }


  function getActiveLocaleCodes() {
    return _.pluck(TheLocaleStore.getActiveLocales(), 'internal_code');
  }

  function widgetIsVisible(widget) {
    return fieldIsVisible(widget.field);
  }

  function fieldIsVisible (field) {
    var isNotDisabled = !field.disabled || $scope.preferences.showDisabledFields;
    var hasErrors = $scope.errorPaths && $scope.errorPaths[field.id];
    return isNotDisabled || hasErrors;
  }

  function getFieldForWidget(widget) {
    return _.find(contentType.data.fields, {id: widget.fieldId});
  }

  function getFieldLocales(field) {
    if (field.localized) {
      return TheLocaleStore.getActiveLocales();
    } else {
      return [TheLocaleStore.getDefaultLocale()];
    }
  }

  function getErrorLocales(field) {
    return $scope.errorPaths && _.map($scope.errorPaths[field.id], function (code) {
      return _.find(TheLocaleStore.getPrivateLocales(), {internal_code: code});
    });
  }

}]);
