'use strict';

angular.module('contentful').controller('FieldWidgetSettingsCtrl', ['$scope', '$injector', function FieldWidgetSettingsCtrl($scope, $injector) {
  var widgetTypes = $injector.get('widgetTypes');

  $scope.field = $scope.getFieldForWidget($scope.widget);

  if($scope.widget.type == 'field') {
    $scope.$watch('widget.widgetType', assembleWidgetOptions);
    widgetTypes.forField($scope.field)
    .then(function (types) {
      $scope.widgetTypesForType = types;
      assembleWidgetOptions($scope.widget.widgetType, $scope.widget.type);
    });
  } else if($scope.widget.type == 'static') {
    assembleWidgetOptions($scope.widget.widgetType, $scope.widget.type);
  }

  function assembleWidgetOptions(widgetType, fieldType) {
    $scope.widgetOptions = widgetTypes.optionsForWidgetType(widgetType, fieldType);
  }

}]);
