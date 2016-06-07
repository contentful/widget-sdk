'use strict';

angular.module('cf.app')
.directive('cfCheckboxEditor', [function () {
  return {
    restrict: 'E',
    scope: {},
    template: JST.cf_checkbox_editor(),
    require: '^cfWidgetApi',
    link: function (scope, elem, attrs, widgetApi) {
      var field = widgetApi.field;
      var options = scope.options = getOptions(field);

      if (options.length === 0) {
        scope.misconfigured = true;
        return;
      }

      scope.$watch('options', function (options) {
        var selected = _.filter(options, 'selected');
        var values = _.map(selected, 'value');
        var oldValues = field.getValue();
        if (!_.isEqual(oldValues, values)) {
          if (values.length === 0) {
            field.removeValue();
          } else {
            field.setValue(values);
          }
        }
      }, true);

      var removeChangeListener = field.onValueChanged(function (values) {
        _.forEach(options, function (option) {
          option.selected = values && values.indexOf(option.value) > -1;
        });
      });

      var removeDisabledStatusListener = field.onDisabledStatusChanged(function (disabled) {
        scope.isDisabled = disabled;
      });

      scope.$on('destroy', function () {
        removeChangeListener();
        removeDisabledStatusListener();
      });


      function getOptions (field) {
        // Get first object that has a 'in' property
        var predefinedValues = _.filter(_.map(field.itemValidations, 'in'))[0];
        return _.map(predefinedValues, function (value, index) {
          return {
            id: ['entity', field.id, field.locale, index].join('.'),
            value: value,
            selected: false
          };
        });
      }
    }
  };
}]);
