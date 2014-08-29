'use strict';

angular.module('contentful').controller('FieldWidgetSettingsCtrl', ['$scope', '$injector', function FieldWidgetSettingsCtrl($scope, $injector) {
  var widgetTypes = $injector.get('widgetTypes');

  $scope.field = $scope.getFieldForWidget($scope.widget);

  $scope.$watch('widget.widgetType', assembleWidgetOptions);

  widgetTypes.forField($scope.field)
  .then(function (types) {
    $scope.widgetTypesForType = types;
    assembleWidgetOptions($scope.widget.widgetType);
  });

  function assembleWidgetOptions(widgetType) {
    $scope.widgetOptions = widgetTypes.optionsForWidgetType(widgetType);
    _.each($scope.widgetOptions, function (option) {
      if (!_.has($scope.widget.widgetParams, option.param)) {
        $scope.widget.widgetParams[option.param] = option.default;
      }
    });
  }

}]);
