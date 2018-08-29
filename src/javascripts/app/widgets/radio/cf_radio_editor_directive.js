'use strict';

angular
  .module('cf.app')
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfRadioEditor
   */
  .directive('cfRadioEditor', [
    'require',
    require => {
      const random = require('random');
      const selectionController = require('widgets/selectionController');
      return {
        restrict: 'E',
        scope: {},
        template: JST['cf_radio_editor'](),
        require: '^cfWidgetApi',
        link: function(scope, _elem, _attrs, widgetApi) {
          selectionController.createFromValidations(widgetApi, scope);

          const field = widgetApi.field;
          scope.radioGroupName = ['entity', field.id, field.locale, random.letter(5)].join('.');
        }
      };
    }
  ]);
