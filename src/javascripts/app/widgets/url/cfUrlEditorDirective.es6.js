import { registerDirective } from 'NgRegistry.es6';
import createInputUpdater from 'ui/inputUpdater.es6';

export default function register() {
  registerDirective('cfUrlEditor', [
    'debounce',
    debounce => ({
      restrict: 'E',
      require: '^cfWidgetApi',
      scope: {},
      template: JST.cf_url_editor(),
      link: function(scope, $el, _attrs, widgetApi) {
        const field = widgetApi.field;
        const $inputEl = $el.find('input');
        const updateInput = createInputUpdater($inputEl.get(0));

        scope.urlStatus = 'ok';

        scope.$watch('urlStatus', urlStatus => {
          const isInvalid = urlStatus === 'broken' || urlStatus === 'invalid';
          field.setInvalid(isInvalid);
        });

        const detachOnValueChangedHandler = field.onValueChanged(val => {
          // Might be `null` or `undefined` when value is not present
          updateInput(val || '');
        });

        // call handler when the disabled status of the field changes
        const detachOnFieldDisabledHandler = field.onIsDisabledChanged(updateDisabledStatus);

        const offSchemaErrorsChanged = field.onSchemaErrorsChanged(errors => {
          scope.hasErrors = errors && errors.length > 0;
        });

        // remove attached handlers when element is evicted from dom
        scope.$on('$destroy', detachOnValueChangedHandler);
        scope.$on('$destroy', detachOnFieldDisabledHandler);
        scope.$on('$destroy', offSchemaErrorsChanged);

        scope.$watch(
          () => $inputEl.val(),
          value => {
            scope.previewUrl = value;
            field.setValue(value);
          }
        );

        $inputEl.on('input change', debounce(scope.$apply.bind(scope), 200));

        function updateDisabledStatus(disabledStatus) {
          scope.isDisabled = disabledStatus;
        }
      }
    })
  ]);
}
