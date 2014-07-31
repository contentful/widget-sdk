'use strict';

angular.module('contentful').controller('FieldWidgetSettingsCtrl', ['$scope', '$injector', function FieldWidgetSettingsCtrl($scope, $injector) {
  var widgetTypes = $injector.get('widgetTypes');
  var _widgetTypeId;

  var COMMON_PARAMS = [
    'helpText'
  ];

  function getWidget() {
    return _.find($scope.editingInterface.widgets, {id: $scope.widget.id});
  }

  $scope.widgetParams = $scope.widget.widgetParams;

  widgetTypes.forField($scope.widget.field).then(function (types) {
    $scope.widgetTypesForType = types;
    $scope.widgetType = $scope.widget.widgetType ?
      _.find(types, {id: $scope.widget.widgetType}) : types[0];
  });

  $scope.$watch('widgetParams', function (params) {
    var widget = getWidget();
    if(widget && params && widget.widgetParams)
      widget.widgetParams = params;
  }, true);

  $scope.$watch('widgetType', function (widgetType) {
    if(widgetType) {
      var widget = getWidget();
      widget.widgetType = widgetType.id;
      if(widgetType.id !== _widgetTypeId)
        widgetTypes.params(widgetType.id).then(function (params) {
          $scope.widgetParams = mergeCommonParams(params);
        });
      _widgetTypeId = widgetType.id;
    }
  });

  function mergeCommonParams(params) {
    if($scope.widgetParams){
      _.each(COMMON_PARAMS, function (paramLabel) {
        params[paramLabel] = $scope.widgetParams[paramLabel];
      });
    }
    return params;
  }

}]);
