'use strict';

angular.module('cf.app')
.directive('cfCheckboxWidget', [function () {
  return {
    restrict: 'E',
    scope: {},
    template: JST.cf_checkbox_widget(),
    require: '^cfWidgetApi',
    link: function (scope, elem, attrs, widgetApi) {
      var field = widgetApi.field;
      var options = scope.options = getOptions(field);

      scope.$watch('options', function (options) {
        var selected = _.filter(options, 'selected');
        var values = _.map(selected, 'value');
        var oldValues = field.getValue();
        if (!_.isEqual(oldValues, values)) {
          field.setValue(values);
        }
      }, true);

      var removeChangeListener = field.onValueChanged(function (values) {
        _.forEach(options, function (option) {
          option.selected = values && values.indexOf(option.value) > -1;
        });
      }, true);

      var removeDisabledStatusListener = field.onDisabledStatusChanged(function (disabled) {
        scope.isDisabled = disabled;
      }, true);

      scope.$on('destroy', function () {
        removeChangeListener();
        removeDisabledStatusListener();
      });


      function getOptions (field) {
        // Get first object that has a 'in' property
        var predefinedValues = _.filter(_.pluck(field.itemValidations, 'in'))[0];
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
