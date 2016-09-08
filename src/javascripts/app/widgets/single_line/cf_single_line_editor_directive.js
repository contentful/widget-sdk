'use strict';

angular.module('contentful')
.directive('cfSingleLineEditor', ['$injector', function ($injector) {
  var InputUpdater = $injector.get('ui/inputUpdater');
  var debounce = $injector.get('debounce');

  return {
    scope: {},
    require: '^cfWidgetApi',
    restrict: 'E',
    template: JST['cf_single_line_editor'](),
    link: function (scope, $el, _attributes, widgetApi) {
      var field = widgetApi.field;
      var constraints = _(field.validations).map('size').filter().first() || {};
      var $inputEl = $el.children('input');
      var updateInput = InputUpdater.create($inputEl.get(0));

      if (field.type === 'Symbol' && !_.isNumber(constraints.max)) {
        constraints.max = 256;
      }

      scope.constraints = constraints;

      // update input field value when new synced value received via ot magic
      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        updateInput(val || '');
      });
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onIsDisabledChanged(updateIsDisabledFlag);

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        scope.hasErrors = errors && errors.length > 0;
      });

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);
      scope.$on('$destroy', offSchemaErrorsChanged);

      // update char count whenever input value changes
      scope.$watch(function () {
        return $inputEl.val();
      }, function (val, prev) {
        updateCharCount(val);

        // do not emit initial value
        // @todo maybe handle it in `setValue`
        if (val !== prev) {
          field.setValue(val);
        }
      });

      $inputEl.on('input change', debounce(scope.$apply.bind(scope), 200));

      function updateCharCount (val) {
        scope.charCount = (val || '').length;
      }

      function updateIsDisabledFlag (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };
}]);
