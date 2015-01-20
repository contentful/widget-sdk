'use strict';

angular.module('contentful').directive('cfFieldWidgetSettings', [function(){
  return {
    template: JST.cf_field_widget_settings(),
    restrict: 'A',
    controller: 'FieldWidgetSettingsController',
    scope: true
  };
}]);
