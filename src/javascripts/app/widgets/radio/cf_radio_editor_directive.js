'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfRadioEditor
 */
.directive('cfRadioEditor', ['$injector', function ($injector) {
  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_radio_editor'](),
    require: '^cfWidgetApi',
    link: function (scope, _elem, _attrs, widgetApi) {
      var selectionController = $injector.get('widgets/selectionController');
      selectionController.createFromValidations(widgetApi, scope);

      var field = widgetApi.field;
      scope.radioGroupName = ['entity', field.id, field.locale].join('.');
    }
  };
}]);
