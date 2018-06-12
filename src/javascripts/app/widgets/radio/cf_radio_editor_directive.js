'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfRadioEditor
 */
.directive('cfRadioEditor', ['require', require => {
  var random = require('random');
  var selectionController = require('widgets/selectionController');
  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_radio_editor'](),
    require: '^cfWidgetApi',
    link: function (scope, _elem, _attrs, widgetApi) {
      selectionController.createFromValidations(widgetApi, scope);

      var field = widgetApi.field;
      scope.radioGroupName = ['entity', field.id, field.locale, random.letter(5)].join('.');
    }
  };
}]);
