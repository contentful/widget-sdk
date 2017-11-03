'use strict';

angular.module('cf.app')

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfBooleanEditor
 */
.directive('cfBooleanEditor', ['require', function (require) {
  var selectionController = require('widgets/selectionController');
  var Random = require('random');

  return {
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    template: JST['cf_radio_editor'](),
    link: function (scope, _elem, _attrs, widgetApi) {
      var settings = widgetApi.settings;
      var options = [
        {value: true, label: settings.trueLabel || 'Yes'},
        {value: false, label: settings.falseLabel || 'No'}
      ];
      selectionController.create(widgetApi, scope, options);

      var field = widgetApi.field;
      scope.radioGroupName = ['entity', field.id, field.locale, Random.letter(5)].join('.');
      scope.horizontalLayout = true;
    }
  };
}]);
