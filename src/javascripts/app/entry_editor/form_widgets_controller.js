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

  var widgets = $injector.get('widgets');
  var eiHelpers = $injector.get('editingInterfaces/helpers');

  $scope.$watchGroup(
    ['preferences.showDisabledFields', 'errorPaths'],
    updateWidgets
  );

  /**
   * Retrieve the widgets from the current editingInterface, build the
   * form widgets, and add them to the scope.
   */
  function updateWidgets () {
    $scope.widgets = _(editingInterface.data.widgets)
      .map(buildWidget)
      .filter(widgetIsVisible)
      .value();
  }

  function buildWidget (widget) {
    var field = eiHelpers.findField(contentType.data.fields, widget);
    var renderable = widgets.buildRenderable(widget);
    renderable.field = field;
    return renderable;
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
