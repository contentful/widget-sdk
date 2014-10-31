'use strict';

angular.module('contentful').controller('FieldWidgetSettingsController', ['$scope', '$injector', function FieldWidgetSettingsController($scope, $injector) {
  var widgets = $injector.get('widgets');

  $scope.field = $scope.getFieldForWidget($scope.widget);

  if($scope.widget.widgetType == 'field') {
    $scope.$watch('widget.widgetId', function (widgetId) {
      if(widgetId) assembleWidgetOptions(widgetId, 'field');
    });
    widgets.forField($scope.field)
    .then(function (types) {
      $scope.widgetsForType = types;
      assembleWidgetOptions($scope.widget.widgetId, $scope.widget.widgetType);
    });
  } else if($scope.widget.widgetType == 'static') {
    assembleWidgetOptions($scope.widget.widgetId, $scope.widget.widgetType);
  }

  function assembleWidgetOptions(widgetId, widgetType) {
    $scope.widgetOptions = widgets.optionsForWidget(widgetId, widgetType);
  }

}]);
