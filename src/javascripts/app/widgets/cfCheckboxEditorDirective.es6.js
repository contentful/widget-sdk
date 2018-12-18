import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

registerDirective('cfCheckboxEditor', () => ({
  restrict: 'E',
  scope: {},
  template: JST.cf_checkbox_editor(),
  require: '^cfWidgetApi',

  link: function(scope, _elem, _attrs, widgetApi) {
    const field = widgetApi.field;
    const options = (scope.options = getOptions(field));

    if (options.length === 0) {
      scope.misconfigured = true;
      return;
    }

    scope.$watch(
      'options',
      options => {
        const selected = _.filter(options, 'selected');
        const values = _.map(selected, 'value');
        const oldValues = field.getValue();
        if (!_.isEqual(oldValues, values)) {
          if (values.length === 0) {
            field.removeValue();
          } else {
            field.setValue(values);
          }
        }
      },
      true
    );

    const removeChangeListener = field.onValueChanged(values => {
      _.forEach(options, option => {
        option.selected = values && values.indexOf(option.value) > -1;
      });
    });

    const removeDisabledStatusListener = field.onIsDisabledChanged(disabled => {
      scope.isDisabled = disabled;
    });

    scope.$on('destroy', () => {
      removeChangeListener();
      removeDisabledStatusListener();
    });

    function getOptions(field) {
      // Get first object that has a 'in' property
      const predefinedValues = _.filter(_.map(field.itemValidations, 'in'))[0];
      return _.map(predefinedValues, (value, index) => ({
        id: ['entity', field.id, field.locale, index].join('.'),
        value: value,
        selected: false
      }));
    }
  }
}));
