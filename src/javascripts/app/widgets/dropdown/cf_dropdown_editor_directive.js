'use strict';

angular.module('cf.app')

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfDropdownEditor
 */
.directive('cfDropdownEditor', ['$injector', function ($injector) {
  return {
    restrict: 'E',
    scope: {},
    template: JST['cf_dropdown_editor'](),
    require: '^cfWidgetApi',
    link: function (scope, elem, attrs, widgetApi) {
      var selectionController = $injector.get('widgets/selectionController');
      selectionController.createFromValidations(widgetApi, scope);
    }
  };
}]);
