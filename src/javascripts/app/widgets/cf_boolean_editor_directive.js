'use strict';

angular
  .module('cf.app')

  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfBooleanEditor
   */
  .directive('cfBooleanEditor', [
    'require',
    require => {
      const selectionController = require('widgets/selectionController');
      const Random = require('random');

      return {
        restrict: 'E',
        scope: {},
        require: '^cfWidgetApi',
        template: JST['cf_radio_editor'](),
        link: function(scope, _elem, _attrs, widgetApi) {
          const settings = widgetApi.settings;
          const options = [
            { value: true, label: settings.trueLabel || 'Yes' },
            { value: false, label: settings.falseLabel || 'No' }
          ];
          selectionController.create(widgetApi, scope, options);

          const field = widgetApi.field;
          scope.radioGroupName = ['entity', field.id, field.locale, Random.letter(5)].join('.');
          scope.horizontalLayout = true;
        }
      };
    }
  ]);
