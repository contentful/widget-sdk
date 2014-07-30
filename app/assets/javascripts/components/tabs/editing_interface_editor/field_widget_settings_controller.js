'use strict';

angular.module('contentful').controller('FieldWidgetSettingsCtrl', ['$scope', '$injector', function FieldWidgetSettingsCtrl($scope, $injector) {
  var widgetTypes = $injector.get('widgetTypes');
  var _widgetTypeId;

  var COMMON_OPTIONS = [
    'helpText'
  ];

  function getWidget() {
    return _.find($scope.editingInterface.widgets, {id: $scope.widget.id});
  }

  $scope.widgetOptions = $scope.widget.widgetOptions;

  widgetTypes.forFieldType($scope.widget.field.type).then(function (types) {
    $scope.widgetTypesForType = types;
    $scope.widgetType = $scope.widget.widgetType ?
      _.find(types, {id: $scope.widget.widgetType}) : types[0];
  });

  $scope.$watch('widgetOptions', function (options) {
    var widget = getWidget();
    if(widget && options && widget.widgetOptions)
      widget.widgetOptions = options;
  }, true);

  $scope.$watch('widgetType', function (widgetType) {
    if(widgetType) {
      var widget = getWidget();
      widget.widgetType = widgetType.id;
      if(widgetType.id !== _widgetTypeId)
        widgetTypes.options(widgetType.id).then(function (options) {
          $scope.widgetOptions = mergeCommonOptions(options);
        });
      _widgetTypeId = widgetType.id;
    }
  });

  function mergeCommonOptions(options) {
    if($scope.widgetOptions){
      _.each(COMMON_OPTIONS, function (optionLabel) {
        options[optionLabel] = $scope.widgetOptions[optionLabel];
      });
    }
    return options;
  }

}]);
