'use strict';

angular.module('cf.app')

/**
 * @ngdoc directive
 * @module cf.app
 * @name cfDropdownEditor
 */
.directive('cfDropdownEditor', ['require', require => ({
  restrict: 'E',
  scope: {},
  template: JST['cf_dropdown_editor'](),
  require: '^cfWidgetApi',

  link: function (scope, _elem, _attrs, widgetApi) {
    var selectionController = require('widgets/selectionController');
    selectionController.createFromValidations(widgetApi, scope);
  }
})]);
