'use strict';

angular.module('contentful').directive('fieldWidgetSettings', [function(){
  return {
    template: JST.field_widget_settings(),
    restrict: 'C',
    controller: 'FieldWidgetSettingsCtrl',
    scope: true,
    link: function (scope, elem) {
    }
  };
}]);
