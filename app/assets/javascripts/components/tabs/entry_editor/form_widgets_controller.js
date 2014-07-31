'use strict';
angular.module('contentful').controller('FormWidgetsController', ['$scope', '$injector', function FormWidgetsController($scope, $injector){
  var controller = this;
  var editingInterfaces = $injector.get('editingInterfaces');
  var sentry            = $injector.get('sentry');

  $scope.$watch(function (scope) {
    return _.pluck(scope.spaceContext.activeLocales, 'code');
  }, updateWidgets, true);
  $scope.$watch('spaceContext.space.getDefaultLocale()', updateWidgets);
  $scope.$watch('preferences.showDisabledFields',        updateWidgets);
  $scope.$watch('errorPaths',                            updateWidgets);

  this.updateWidgets = updateWidgets;
  this.updateWidgetsFromInterface = updateWidgetsFromInterface;

  function updateWidgets() {
    if (controller.contentType)
      editingInterfaces.forContentTypeWithId(controller.contentType, 'default')
      .then(updateWidgetsFromInterface);
  }

  function updateWidgetsFromInterface(interf) {
    $scope.widgets = _(interf.widgets)
      .filter(widgetIsVisible)
      .map(addLocalesAndFieldToWidget)
      .value();
  }

  function addLocalesAndFieldToWidget(widget) {
    if (widget.type === 'field') {
      var field = getWidgetField(widget);
      var locales = _.union(getFieldLocales(field), getErrorLocales(field));
      locales = makeUnique(locales);
      return inherit(widget, {
        field: getWidgetField(widget),
        locales: locales
      });
    } else {
      return inherit(widget, {
        locales: [$scope.spaceContext.space.getDefaultLocale()]
      });
    }
  }

  function widgetIsVisible(widget) {
    return widget.type === 'static' || fieldIsEditable(getWidgetField(widget));
  }

  function fieldIsEditable(field) {
    return !field.disabled || $scope.preferences.showDisabledFields || $scope.errorPaths && $scope.errorPaths[field.id];
  }

  function makeUnique(locales) {
    var uniqLocales = _.uniq(locales, 'code');
    if(locales.length !== uniqLocales.length){
      sentry.captureError('Locales have been duplicated', {
        data: {
          locales: locales,
          activeLocales: $scope.spaceContext.activeLocales
        }
      });
    }
    return uniqLocales;
  }

  function getWidgetField(widget) {
    return _.find(controller.contentType.data.fields, {id: widget.fieldId});
  }

  function getFieldLocales(field) {
    if (field.localized)
      return $scope.spaceContext.activeLocales;
    else
      return [$scope.spaceContext.space.getDefaultLocale()];
  }

  function getErrorLocales(field) {
    return $scope.errorPaths && _.map($scope.errorPaths[field.id], function (code) {
      return _.find($scope.spaceContext.space.data.locales, {code: code});
    });
  }

  function inherit(source, extensions){
    var Clone = function () { };
    Clone.prototype = source;
    var clone = new Clone();
    return _.extend(clone, extensions);
  }

}]);
