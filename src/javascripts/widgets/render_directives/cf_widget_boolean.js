'use strict';

angular.module('contentful')
.directive('cfWidgetBoolean', [function () {
  return {
    template: JST['cf_radio_editor'](),
    controller: ['$scope', function ($scope) {
      var params = $scope.widget.widgetParams;
      this.valuesList = [
        {value: true,  label: params.trueLabel || 'Yes'},
        {value: false, label: params.falseLabel || 'No'},
      ];
      this.selected   = {value: null};
    }],
    controllerAs: 'valuesController'
  };

}]);
