'use strict';

angular.module('contentful').controller('FieldWidgetSettingsCtrl', ['$scope', '$injector', function FieldWidgetSettingsCtrl($scope, $injector) {
  var widgetTypes = $injector.get('widgetTypes');

  function getWidget() {
    return _.find($scope.editingInterface.widgets, {id: $scope.widget.id});
  }

  $scope.$watch('widget.widgetOptions', function (options) {
    var widget = getWidget();
    if(widget && options && widget.widgetOptions)
      widget.widgetOptions = options;
  }, true);

  $scope.$watch('widget.field.type', function (fieldType) {
    widgetTypes.forFieldType(fieldType).then(function (types) {
      $scope.widgetTypesForType = types;
      $scope.widgetType = types[0];
    });
  });

  $scope.$watch('widgetType', function (widgetType) {
    if(widgetType) {
      var widget = getWidget();
      widget.widgetType = widgetType.id;
      widgetTypes.options(widgetType.id).then(function (options) {
        widget.widgetOptions = options;
      });
    }
  });

}]);
