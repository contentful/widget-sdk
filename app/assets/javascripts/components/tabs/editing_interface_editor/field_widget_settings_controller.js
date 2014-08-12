'use strict';

angular.module('contentful').controller('FieldWidgetSettingsCtrl', ['$scope', '$injector', function FieldWidgetSettingsCtrl($scope, $injector) {
  var widgetTypes = $injector.get('widgetTypes');

  $scope.field = $scope.getFieldForWidget($scope.widget);

  widgetTypes.forField($scope.field)
  .then(function (types) {
    $scope.widgetTypesForType = types;
    assembleWidgetOptions($scope.widget.widgetType);
  });

  $scope.$watch('widget.widgetType', assembleWidgetOptions);

  function assembleWidgetOptions(widgetType) {
    if (!$scope.widgetTypesForType) return;
    var selectedWidget = _.find($scope.widgetTypesForType, {id: widgetType});
    $scope.widgetOptions = widgetTypes.optionsForWidget(selectedWidget);
    _.each($scope.widgetOptions, function (option) {
      if (!_.has($scope.widget.widgetParams, option.param)) {
        $scope.widget.widgetParams[option.param] = option.default;
      }
    });
  }

}]);
