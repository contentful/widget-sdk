'use strict';

angular.module('contentful')

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfWidgetBoolean
 */
.directive('cfWidgetBoolean', ['$injector', function ($injector) {
  var selectionController = $injector.get('widgets/selectionController');

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
      scope.radioGroupName = ['entity', field.id, field.locale].join('.');
      scope.horizontalLayout = true;
    }
  };

}]);
