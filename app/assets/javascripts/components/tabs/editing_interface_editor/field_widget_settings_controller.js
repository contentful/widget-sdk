'use strict';

angular.module('contentful').controller('FieldWidgetSettingsCtrl', ['$scope', '$injector', function FieldWidgetSettingsCtrl($scope, $injector) {
  var widgetTypes = $injector.get('widgetTypes');
  var _widgetTypeId;

  var COMMON_PARAMS = [
    'helpText'
  ];

  $scope.field = $scope.getFieldForWidget($scope.widget);

  widgetTypes.forField($scope.field).then(function (types) {
    $scope.widgetTypesForType = types;
    $scope.selectedWidgetType = $scope.widget.widgetType ?
      _.find(types, {id: $scope.widget.widgetType}) : types[0];
  });

  $scope.$watch('selectedWidgetType', function (widgetType) {
    if(widgetType) {
      $scope.widget.widgetType = widgetType.id;
      if(widgetType.id !== _widgetTypeId){
        widgetTypes.params(widgetType.id).then(function (params) {
          $scope.widget.widgetParams = mergeCommonParams(params);
        });
      }
      _widgetTypeId = widgetType.id;
    }
  });

  function mergeCommonParams(params) {
    if($scope.widget.widgetParams){
      _.each(COMMON_PARAMS, function (paramLabel) {
        params[paramLabel] = $scope.widget.widgetParams[paramLabel];
      });
    }
    return params;
  }

}]);
